// analytics/main.go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"os"
	"strconv"

	pb "event-analytics/proto/event-analytics/proto"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
)

type server struct {
	pb.UnimplementedAnalyticsServiceServer
	db *sql.DB
}

var rdb = redis.NewClient(&redis.Options{
	Addr: "redis:6379",
	DB:   0,
})

func (s *server) GetEventCount(ctx context.Context, req *pb.EventCountRequest) (*pb.EventCountResponse, error) {
	var count int64
	var CompactStr = req.UserId + "__+__" + req.PageUrl
	val, err := rdb.Get(ctx, CompactStr).Result()

	if err == redis.Nil {
		fmt.Println("Key does not exist")
		err = s.db.QueryRow(`
        SELECT click_count FROM page_clicks 
        WHERE user_id = $1 AND page_url = $2
    `, req.UserId, req.PageUrl).Scan(&count)

		if err != nil {
			return nil, err
		}
		err = rdb.Set(ctx, CompactStr, count, 0).Err()
		if err != nil {
			log.Fatalf("Error setting value: %v", err)
		}

		return &pb.EventCountResponse{
			Count:   count,
			UserId:  req.UserId,
			PageUrl: req.PageUrl,
		}, nil

	} else if err != nil {
		log.Fatalf("Error getting value: %v", err)
	}
	log.Println("CACHE GOT HIT")
	count, err = strconv.ParseInt(val, 10, 64)
	if err != nil {
		log.Fatalf("Error while caching")
	}
	return &pb.EventCountResponse{
		Count:   count,
		UserId:  req.UserId,
		PageUrl: req.PageUrl,
	}, nil

}

func main() {
	// DB connection
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
	fmt.Println("Redis got connected: ", pong)

	log.Print(os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// gRPC server
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatal(err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterAnalyticsServiceServer(grpcServer, &server{db: db})

	log.Println("Analytics service listening on :50051")
	grpcServer.Serve(lis)
}

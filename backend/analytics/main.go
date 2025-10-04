// analytics/main.go
package main

import (
	"context"
	"database/sql"
	"log"
	"net"
	"os"

	pb "event-analytics/proto/event-analytics/proto"

	_ "github.com/lib/pq"
	"google.golang.org/grpc"
)

type server struct {
	pb.UnimplementedAnalyticsServiceServer
	db *sql.DB
}

func (s *server) GetEventCount(ctx context.Context, req *pb.EventCountRequest) (*pb.EventCountResponse, error) {
	var count int64
	err := s.db.QueryRow(`
        SELECT click_count FROM page_clicks 
        WHERE user_id = $1 AND page_url = $2
    `, req.UserId, req.PageUrl).Scan(&count)

	if err != nil {
		return nil, err
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

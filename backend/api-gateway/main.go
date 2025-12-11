package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	pb "event-analytics/proto/event-analytics/proto"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var analyticsClient pb.AnalyticsServiceClient

func initGRPCclient() {
	var conn *grpc.ClientConn
	var err error

	// Retry connection with backoff
	for i := 0; i < 5; i++ {
		conn, err = grpc.NewClient("analytics:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err == nil {
			break
		}
		log.Printf("Failed to connect to analytics service, retry %d/5: %v", i+1, err)
		time.Sleep(time.Duration(i+1) * time.Second)
	}

	if err != nil {
		log.Fatalf("FATAL: could not connect to grpc server after 5 retries: %v", err)
	}

	analyticsClient = pb.NewAnalyticsServiceClient(conn)

	log.Print("STATUS SUCCESSFULL: GPRC server connected with client, working smooothly")
}

func analyticsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserID  string `json:"user_id"`
		PageUrl string `json:"page_url"`
	}

	err := json.NewDecoder(r.Body).Decode(&req)

	if err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	resp, err := analyticsClient.GetEventCount(ctx, &pb.EventCountRequest{
		UserId:  req.UserID,
		PageUrl: req.PageUrl,
	})

	if err != nil {
		log.Printf("grpc called failed %v", err)
		http.Error(w, "failed to get analytics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"user_id":  resp.UserId,
		"page_url": resp.PageUrl,
		"count":    resp.Count,
	})

}

func main() {
	initGRPCclient()

	http.HandleFunc("/analytics/events", analyticsHandler)
	http.Handle("/metrics", promhttp.Handler())

	log.Println("API Gateway listening on :8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatal(err)
	}
}

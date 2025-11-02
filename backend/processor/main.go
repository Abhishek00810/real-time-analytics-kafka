package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"
)

type ClickEvent struct {
	EventId   string    `json:"event_id"`
	UserId    string    `json:"user_id"`
	EventType string    `json:"event_type"`
	PageUrl   string    `json:"page_url"`
	TimeStamp time.Time `json:"time_stamp"`
}

var (
	rdb         *redis.Client
	kafkaBroker string
	kafkaTopic  string
	db          *sql.DB
	consumer    *kafka.Reader
)

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value != "" {
		return value
	}
	return fallback
}

// ✅ Helper to get Redis address
func getRedisAddr() string {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		host := os.Getenv("REDIS_HOST")
		port := os.Getenv("REDIS_PORT")
		if host == "" {
			host = "localhost"
		}
		if port == "" {
			port = "6379"
		}
		addr = host + ":" + port
	}
	return addr
}

func createConsumer(kafkaBroker, kafkaTopic string) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:     []string{kafkaBroker},
		Topic:       kafkaTopic,
		GroupID:     "click-processor-group",
		StartOffset: kafka.LastOffset,
	})
}

func DBInit() {
	var err error
	dbURL := getEnv("DATABASE_URL", "postgres://user:password@localhost:5432/events?sslmode=disable")

	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("FATAL: can't connect to the database, %v", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatalf("FATAL: can't ping database, %v", err)
	}
	log.Println("Database connected successfully")
}

func main() {
	// ✅ Initialize Redis INSIDE main
	rdb = redis.NewClient(&redis.Options{
		Addr: getRedisAddr(),
		DB:   0,
	})

	// Test Redis connection
	ctx := context.Background()
	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Printf("Warning: Could not connect to Redis: %v", err)
	} else {
		log.Printf("Redis connected: %s", pong)
	}

	// Initialize Kafka config
	kafkaBroker = getEnv("KAFKA_BROKER", "localhost:9092")
	kafkaTopic = getEnv("KAFKA_TOPIC", "clicks")

	log.Printf("Config: Broker=%s, Topic=%s", kafkaBroker, kafkaTopic)

	// Create consumer
	consumer = createConsumer(kafkaBroker, kafkaTopic)
	defer consumer.Close()

	// Initialize DB
	DBInit()
	defer db.Close()

	log.Printf("Starting Kafka consumer for topic: %s on broker: %s", kafkaTopic, kafkaBroker)

	for {
		ctx := context.Background()

		msg, err := consumer.ReadMessage(ctx)
		if err != nil {
			log.Printf("Can't read the message, %v", err)
			time.Sleep(5 * time.Second) // ✅ Add delay to avoid spam
			continue
		}

		log.Printf("Received message: %s", string(msg.Value))

		var event ClickEvent
		err = json.Unmarshal(msg.Value, &event)
		if err != nil {
			log.Printf("Failed to unmarshal event: %v", err)
			continue
		}

		_, err = db.Exec(`INSERT INTO click_events (event_id, user_id, event_type, page_url, time_stamp)
						VALUES ($1, $2, $3, $4, $5) ON CONFLICT (event_id) DO NOTHING`,
			event.EventId, event.UserId, event.EventType, event.PageUrl, event.TimeStamp)

		if err != nil {
			log.Printf("Failed to store raw event: %v", err)
		}

		_, err = db.Exec(`INSERT INTO page_clicks (user_id, page_url, click_count) VALUES 
							($1, $2, 1) ON CONFLICT (user_id, page_url) DO UPDATE SET click_count = page_clicks.click_count + 1`,
			event.UserId, event.PageUrl)

		if err != nil {
			log.Printf("Failed to store aggregated event: %v", err)
		}

		var CompactStr = event.UserId + "__+__" + event.PageUrl

		KeyDeleted, err := rdb.Del(ctx, CompactStr).Result()

		if err != nil {
			log.Printf("error: Can't delete the existing cache: %v", err)
		} else {
			log.Printf("successfully deleted old cache: %d", KeyDeleted)
		}
	}
}

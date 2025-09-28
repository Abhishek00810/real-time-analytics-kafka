package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
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
	kafkaBroker = getEnv("KAFKA_BROKER", "localhost:9092")
	kafkaTopic  = getEnv("KAFKA_TOPIC", "clicks")
)
var db *sql.DB

func getEnv(key, fallback string) string {
	var Key_Check = os.Getenv(key)
	log.Println("KEY CHECK: ", Key_Check)
	if Key_Check != "" {
		return Key_Check
	} else {
		return fallback
	}
}

func createConsumer(kafkaBroker, kafkaTopic string) *kafka.Reader {
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:     []string{kafkaBroker},
		Topic:       kafkaTopic,
		GroupID:     "click-processor-group",
		StartOffset: kafka.LastOffset, // Start from the latest messages, not from beginning
	})
}

var consumer = createConsumer(kafkaBroker, kafkaTopic)

func DBInit() {
	var err error
	dbURL := getEnv("DATABASE_URL", "postgres://user:password@postgres:5432/events?sslmode=disable")

	db, err = sql.Open("postgres", dbURL)
	log.Print(dbURL)
	if err != nil {
		log.Fatalf("FATAL: can't connect to the database, %v", err)
	}
}

func main() {
	err := godotenv.Load()

	if err != nil {
		log.Print("can't load the env files")
	}
	DBInit()
	log.Printf("Starting Kafka consumer for topic: %s on broker: %s", kafkaTopic, kafkaBroker)

	for {
		ctx := context.Background() // single context for consumer

		msg, err := consumer.ReadMessage(ctx)

		if err != nil {
			log.Printf("Can't read the message, %v", err)
			continue
		}

		log.Printf("This is the message: %s", string(msg.Value))

		var event ClickEvent
		err = json.Unmarshal(msg.Value, &event)

		if err != nil {
			log.Printf("can't provide the event into meaningful format: %s", err)
		}

		_, err = db.Exec(`INSERT INTO click_events (event_id, user_id, event_type, page_url, time_stamp)
						VALUES ($1, $2, $3, $4, $5) ON CONFLICT (event_id) DO NOTHING`,
			event.EventId, event.UserId, event.EventType, event.PageUrl, event.TimeStamp) //raw events

		if err != nil {
			log.Printf("could not store in the raw database %v", err)
		}

		_, err = db.Exec(`INSERT INTO page_clicks (user_id, page_url, click_count) VALUES 
							($1, $2, 1) ON CONFLICT (user_id, page_url) DO UPDATE SET click_count = page_clicks.click_count + 1`,
			event.UserId, event.PageUrl) // dedicated real events refined one

		if err != nil {
			log.Printf("could not store in the refined database %v", err)
		}

	}
}

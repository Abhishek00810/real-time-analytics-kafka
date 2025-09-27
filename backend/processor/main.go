package main

import (
	"context"
	"log"
	"os"
	"time"

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

func getEnv(key, fallback string) string {
	var Key_Check = os.Getenv(key)
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

func main() {
	log.Printf("Starting Kafka consumer for topic: %s on broker: %s", kafkaTopic, kafkaBroker)

	for {
		ctx, cancel := context.WithCancel(context.Background())

		msg, err := consumer.ReadMessage(ctx)

		if err != nil {
			log.Printf("Can't read the message, %v", err)
			cancel()
			continue
		}

		log.Printf("This is the message: %s", string(msg.Value))

		cancel()
	}
}

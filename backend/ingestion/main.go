package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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

type IngestService struct {
	EventChannel chan<- ClickEvent
}

func createProducer(kafkaBroker, kafkaTopic string) *kafka.Writer {
	return kafka.NewWriter(kafka.WriterConfig{
		Brokers: []string{kafkaBroker},
		Topic:   kafkaTopic,
	})
}

var producer = createProducer(kafkaBroker, kafkaTopic)

// response , request
func (s *IngestService) ingestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var PerClickEvent ClickEvent
	err := json.NewDecoder(r.Body).Decode(&PerClickEvent)

	if err != nil {
		http.Error(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if PerClickEvent.TimeStamp.IsZero() {
		PerClickEvent.TimeStamp = time.Now()
	}
	s.EventChannel <- PerClickEvent

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(PerClickEvent)

}

func main() {

	eventChannel := make(chan ClickEvent, 100)
	service := IngestService{
		EventChannel: eventChannel,
	}

	http.HandleFunc("/ingest", service.ingestHandler) // here service is one struct copy where event channel has created and know it

	go func() {
		for event := range eventChannel {
			data, err := json.Marshal(event)

			if err != nil {
				log.Printf("Error while serializing data: %v", err)
				continue
			}

			ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)

			err = producer.WriteMessages(ctx, kafka.Message{
				Key:   []byte(event.EventId),
				Value: data,
			})

			cancel()

			if err != nil {
				log.Printf("Not able to write message in kafka stream: %v", err)
				return
			}

		}
	}()

	fmt.Println("Starting your port at 8080")

	err := http.ListenAndServe(":8080", nil)

	if err != nil {
		log.Printf("ERROR: Server is not starting : %v \n", err)
		return
	}

}

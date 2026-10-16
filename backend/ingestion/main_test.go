package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestIngestHandlerValidation(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantQueued int
	}{
		{"empty object", `{}`, http.StatusBadRequest, 0},
		{"missing event_type", `{"event_id":"e1","user_id":"u1"}`, http.StatusBadRequest, 0},
		{"missing event_id", `{"user_id":"u1","event_type":"click"}`, http.StatusBadRequest, 0},
		{"missing user_id", `{"event_id":"e1","event_type":"click"}`, http.StatusBadRequest, 0},
		{"whitespace fields", `{"event_id":" ","user_id":"\t","event_type":"  "}`, http.StatusBadRequest, 0},
		{"valid event", `{"event_id":"e1","user_id":"u1","event_type":"click"}`, http.StatusOK, 1},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ch := make(chan ClickEvent, 1)
			s := IngestService{EventChannel: ch}

			req := httptest.NewRequest(http.MethodPost, "/ingest", strings.NewReader(tc.body))
			rec := httptest.NewRecorder()
			s.ingestHandler(rec, req)

			if rec.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			if len(ch) != tc.wantQueued {
				t.Errorf("queued events = %d, want %d", len(ch), tc.wantQueued)
			}
		})
	}
}

package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestIngestHandlerValidation(t *testing.T) {
	tests := []struct {
		name     string
		body     string
		wantCode int
		wantLen  int
	}{
		{"empty object", `{}`, http.StatusBadRequest, 0},
		{"missing event_type", `{"event_id":"e1","user_id":"u1"}`, http.StatusBadRequest, 0},
		{"whitespace user_id", `{"event_id":"e1","user_id":"  ","event_type":"click"}`, http.StatusBadRequest, 0},
		{"whitespace event_id", `{"event_id":"\t","user_id":"u1","event_type":"click"}`, http.StatusBadRequest, 0},
		{"valid event", `{"event_id":"e1","user_id":"u1","event_type":"click"}`, http.StatusOK, 1},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ch := make(chan ClickEvent, 1)
			s := &IngestService{EventChannel: ch}

			req := httptest.NewRequest(http.MethodPost, "/ingest", strings.NewReader(tc.body))
			rec := httptest.NewRecorder()
			s.ingestHandler(rec, req)

			if rec.Code != tc.wantCode {
				t.Errorf("status = %d, want %d", rec.Code, tc.wantCode)
			}
			if len(ch) != tc.wantLen {
				t.Errorf("len(ch) = %d, want %d", len(ch), tc.wantLen)
			}
		})
	}
}

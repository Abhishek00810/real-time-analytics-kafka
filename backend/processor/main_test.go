package main

import (
	"context"
	"database/sql"
	"os"
	"testing"
	"time"
)

// Requires a Postgres instance with infra/init.sql applied; set
// TEST_DATABASE_URL to run, e.g.
// postgres://user:password@localhost:5432/events?sslmode=disable
func openTestDB(t *testing.T) *sql.DB {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL not set")
	}
	tdb, err := sql.Open("postgres", url)
	if err != nil {
		t.Fatal(err)
	}
	if err := tdb.Ping(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { tdb.Close() })
	return tdb
}

func TestStoreEventDedupesAggregate(t *testing.T) {
	tdb := openTestDB(t)
	ctx := context.Background()

	user := "u-dup-test-" + time.Now().Format("150405.000000000")
	page := "/home"
	cleanup := func() {
		tdb.Exec(`DELETE FROM click_events WHERE user_id = $1`, user)
		tdb.Exec(`DELETE FROM page_clicks WHERE user_id = $1`, user)
	}
	cleanup()
	t.Cleanup(cleanup)

	send := func(id string, wantChanged bool) {
		t.Helper()
		changed, err := storeEvent(ctx, tdb, ClickEvent{
			EventId: user + "-" + id, UserId: user, EventType: "click",
			PageUrl: page, TimeStamp: time.Now(),
		})
		if err != nil {
			t.Fatalf("storeEvent(%s): %v", id, err)
		}
		if changed != wantChanged {
			t.Fatalf("storeEvent(%s) changed = %v, want %v", id, changed, wantChanged)
		}
	}

	send("dup-1", true)
	send("dup-1", false)
	send("dup-1", false)
	send("uniq-1", true)
	send("uniq-2", true)

	var count int
	if err := tdb.QueryRow(`SELECT click_count FROM page_clicks WHERE user_id = $1 AND page_url = $2`,
		user, page).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 3 {
		t.Fatalf("click_count = %d, want 3", count)
	}

	var mismatches int
	if err := tdb.QueryRow(`SELECT count(*) FROM (
		SELECT p.user_id FROM page_clicks p
		LEFT JOIN click_events c ON c.user_id = p.user_id AND c.page_url = p.page_url
		WHERE p.user_id = $1
		GROUP BY p.user_id, p.page_url, p.click_count
		HAVING p.click_count <> count(c.event_id)) m`, user).Scan(&mismatches); err != nil {
		t.Fatal(err)
	}
	if mismatches != 0 {
		t.Fatalf("page_clicks/click_events invariant violated for %d rows", mismatches)
	}
}

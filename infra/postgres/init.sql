-- init.sql 

CREATE TABLE IF NOT EXISTS click_events (
    event_id   TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    event_type TEXT NOT NULL,
    page_url   TEXT NOT NULL,
    time_stamp TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS page_clicks (
    user_id     TEXT NOT NULL,
    page_url    TEXT NOT NULL,
    click_count INT DEFAULT 0,
    PRIMARY KEY (user_id, page_url)
);

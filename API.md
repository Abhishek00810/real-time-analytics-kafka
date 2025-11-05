# API Documentation

## Ingestion Service

### Endpoint: POST `/ingest`

Ingests a click event into the system.

**URL**: `http://localhost:8080/ingest` (local) or `http://localhost:30080/ingest` (K8s NodePort)

**Method**: `POST`

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "event_id": "unique_event_id",
  "user_id": "user_123",
  "event_type": "click",
  "page_url": "https://example.com/page",
  "time_stamp": "2025-11-05T20:00:00Z"
}
```

**Request Fields**:
- `event_id` (string, required): Unique identifier for the event
- `user_id` (string, required): User identifier
- `event_type` (string, required): Type of event (e.g., "click")
- `page_url` (string, required): URL of the page where the event occurred
- `time_stamp` (string, optional): ISO 8601 timestamp. If not provided, current time is used

**Response**:
- **Status Code**: `200 OK`
- **Body**: Echo of the ingested event

```json
{
  "event_id": "unique_event_id",
  "user_id": "user_123",
  "event_type": "click",
  "page_url": "https://example.com/page",
  "time_stamp": "2025-11-05T20:00:00Z"
}
```

**Example**:
```bash
curl -X POST http://localhost:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event_123",
    "user_id": "user_1",
    "event_type": "click",
    "page_url": "https://example.com",
    "time_stamp": "2025-11-05T20:00:00Z"
  }'
```

**Error Responses**:
- `400 Bad Request`: Invalid JSON body
- `405 Method Not Allowed`: Method other than POST

---

## API Gateway

### Endpoint: GET `/analytics/events`

Retrieves click count analytics for a specific user and page.

**URL**: `http://localhost:8081/analytics/events` (local) or `http://localhost:30081/analytics/events` (K8s NodePort)

**Method**: `GET`

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "user_id": "user_123",
  "page_url": "https://example.com/page"
}
```

**Request Fields**:
- `user_id` (string, required): User identifier
- `page_url` (string, required): Page URL to query

**Response**:
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "user_id": "user_123",
  "page_url": "https://example.com/page",
  "count": 42
}
```

**Response Fields**:
- `user_id` (string): User identifier
- `page_url` (string): Page URL
- `count` (integer): Total click count for this user+page combination

**Example**:
```bash
curl -X GET http://localhost:8081/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_1", "page_url": "https://example.com"}'
```

**Error Responses**:
- `400 Bad Request`: Invalid JSON body
- `405 Method Not Allowed`: Method other than GET
- `500 Internal Server Error`: Failed to get analytics (gRPC error, database error, etc.)

**Performance**:
- **Cached Response**: < 10ms
- **Database Response**: < 50ms

---

## Analytics Service (gRPC)

### Service: `AnalyticsService`

**Port**: `50051`

**Protocol**: gRPC

### Method: `GetEventCount`

Retrieves click count for a specific user and page.

**Request** (protobuf):
```protobuf
message EventCountRequest {
  string user_id = 1;
  string page_url = 2;
}
```

**Response** (protobuf):
```protobuf
message EventCountResponse {
  int64 count = 1;
  string user_id = 2;
  string page_url = 3;
}
```

**Example** (using grpcurl):
```bash
grpcurl -plaintext -d '{
  "user_id": "user_1",
  "page_url": "https://example.com"
}' localhost:50051 analytics.AnalyticsService/GetEventCount
```

---

## Data Flow

### Complete Flow Example

1. **Ingest Event**:
```bash
curl -X POST http://localhost:8080/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event_123",
    "user_id": "user_1",
    "event_type": "click",
    "page_url": "https://example.com",
    "time_stamp": "2025-11-05T20:00:00Z"
  }'
```

2. **Wait for Processing** (5-10 seconds):
   - Event is consumed from Kafka
   - Stored in database
   - Cache invalidated

3. **Query Analytics**:
```bash
curl -X GET http://localhost:8081/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_1", "page_url": "https://example.com"}'
```

**Expected Response**:
```json
{
  "user_id": "user_1",
  "page_url": "https://example.com",
  "count": 1
}
```

4. **Second Query** (Cache Hit):
```bash
curl -X GET http://localhost:8081/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_1", "page_url": "https://example.com"}'
```

**Expected Response** (same, but served from cache):
```json
{
  "user_id": "user_1",
  "page_url": "https://example.com",
  "count": 1
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding:
- API Gateway rate limiting
- Per-user rate limits
- Per-endpoint rate limits

---

## Authentication & Authorization

Currently, no authentication is implemented. For production:
- API keys
- JWT tokens
- OAuth 2.0
- Service mesh authentication (mTLS)

---

## Monitoring & Metrics

### Key Metrics to Monitor

- **Ingestion Rate**: Events/second
- **Processing Latency**: Time from ingestion to database storage
- **Query Latency**: P50, P95, P99 latencies
- **Cache Hit Rate**: Percentage of cache hits
- **Error Rate**: Failed requests per second

### Logging

All services log to stdout. Key log entries:
- `Received message`: Processor consumed event
- `CACHE GOT HIT`: Analytics served from cache
- `Key does not exist`: Cache miss, querying database
- `successfully deleted old cache`: Cache invalidation

---

## Error Handling

### Common Errors

1. **Connection Refused**: Service not running or wrong port
2. **Timeout**: Service overloaded or network issue
3. **Invalid JSON**: Malformed request body
4. **Database Error**: Database connection issue or query failure

### Retry Logic

- API Gateway: Retries gRPC connection (5 attempts with exponential backoff)
- Processor: Retries Kafka consumption on errors

---

## Best Practices

1. **Event IDs**: Use unique, deterministic IDs (e.g., UUID)
2. **Timestamps**: Use ISO 8601 format with timezone
3. **User IDs**: Use consistent format across events
4. **Page URLs**: Normalize URLs (remove trailing slashes, query params if needed)
5. **Error Handling**: Implement retry logic in clients
6. **Monitoring**: Monitor query latencies and cache hit rates


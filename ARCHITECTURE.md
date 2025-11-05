# Architecture Documentation

## System Overview

This is a microservices-based real-time analytics platform designed for high throughput, low latency, and horizontal scalability. The system follows event-driven architecture principles with clear separation of concerns.

## Design Principles

1. **Microservices**: Each service has a single responsibility
2. **Event-Driven**: Asynchronous processing via Kafka
3. **Caching**: Redis for sub-millisecond query responses
4. **Scalability**: Stateless services, horizontally scalable
5. **Resilience**: Retry logic, health checks, graceful degradation

## Service Architecture

### 1. Ingestion Service

**Responsibility**: Accept HTTP requests, validate events, publish to Kafka

**Key Features**:
- RESTful HTTP API (POST `/ingest`)
- Event validation
- Asynchronous Kafka publishing
- Buffered channel for backpressure handling

**Flow**:
```
Client → HTTP POST → Ingestion Service → Kafka Topic
```

**Technology**:
- Go HTTP server
- Kafka Writer (segmentio/kafka-go)
- JSON event schema

**Scaling**:
- Stateless, can scale horizontally
- Load balancer distributes requests

### 2. Processor Service

**Responsibility**: Consume events from Kafka, process, and store in database

**Key Features**:
- Kafka consumer group (ensures at-least-once processing)
- Database transactions for data consistency
- Cache invalidation on data updates
- Error handling and retry logic

**Flow**:
```
Kafka Topic → Processor → PostgreSQL (store) → Redis (invalidate cache)
```

**Technology**:
- Kafka Reader (segmentio/kafka-go)
- PostgreSQL driver (lib/pq)
- Redis client (go-redis/v9)

**Database Schema**:
- `click_events`: Raw event storage (event_id, user_id, event_type, page_url, time_stamp)
- `page_clicks`: Aggregated counts (user_id, page_url, click_count)

**Scaling**:
- Consumer group allows multiple instances
- Database handles concurrent writes
- Redis cache invalidation ensures consistency

### 3. Analytics Service

**Responsibility**: Query analytics data via gRPC with caching

**Key Features**:
- gRPC service (port 50051)
- Cache-aside pattern implementation
- Database fallback on cache miss
- Automatic cache population

**Flow**:
```
Request → Redis (check) → Cache Hit → Return
                ↓ Cache Miss
         PostgreSQL (query) → Redis (store) → Return
```

**Technology**:
- gRPC server (google.golang.org/grpc)
- Redis client (go-redis/v9)
- PostgreSQL driver (lib/pq)

**Cache Strategy**:
- Key format: `{user_id}__+__{page_url}`
- TTL: No expiration (manual invalidation on updates)
- Cache invalidation: Processor deletes keys on data updates

**Scaling**:
- Stateless service, horizontally scalable
- Redis connection pooling
- Database connection pooling

### 4. API Gateway

**Responsibility**: HTTP-to-gRPC gateway for external clients

**Key Features**:
- RESTful HTTP API (GET `/analytics/events`)
- gRPC client with retry logic
- Connection pooling
- Timeout handling

**Flow**:
```
Client → HTTP GET → API Gateway → gRPC → Analytics Service
```

**Technology**:
- Go HTTP server
- gRPC client (google.golang.org/grpc)
- Retry with exponential backoff

**Scaling**:
- Stateless, horizontally scalable
- Load balancer distributes requests

## Data Flow

### Event Ingestion Flow

```
1. Client sends POST /ingest with event data
2. Ingestion service validates event
3. Event published to Kafka topic "clicks"
4. Ingestion returns 200 OK immediately
```

### Event Processing Flow

```
1. Processor consumes event from Kafka
2. Stores raw event in click_events table
3. Upserts aggregated count in page_clicks table
4. Deletes corresponding Redis cache key (invalidation)
```

### Query Flow

**First Query (Cache Miss)**:
```
1. API Gateway receives GET /analytics/events
2. Calls Analytics service via gRPC
3. Analytics checks Redis cache → MISS
4. Queries PostgreSQL for click_count
5. Stores result in Redis cache
6. Returns response to client
```

**Subsequent Queries (Cache Hit)**:
```
1. API Gateway receives GET /analytics/events
2. Calls Analytics service via gRPC
3. Analytics checks Redis cache → HIT
4. Returns cached result immediately
```

## Infrastructure Components

### PostgreSQL

- **Purpose**: Persistent data storage
- **Deployment**: Kubernetes StatefulSet
- **Schema**: See `infra/init.sql`
- **Connection**: Pooled connections via Go driver

### Redis

- **Purpose**: High-speed caching layer
- **Deployment**: Kubernetes StatefulSet
- **Pattern**: Cache-aside
- **Key Strategy**: Composite keys for user+page combinations

### Redpanda (Kafka)

- **Purpose**: Event streaming and message queue
- **Deployment**: Kubernetes StatefulSet
- **Topic**: "clicks" (single partition for now)
- **Consumer Group**: "click-processor-group"

## Kubernetes Architecture

### Namespaces

- **app-layer**: Application services (ingestion, processor, analytics, api-gateway)
- **data-layer**: Data services (postgres, redis, redpanda)

### Services

- **ClusterIP**: Internal service discovery
- **NodePort**: External access for testing (ports 30080, 30081, 30051)

### StatefulSets vs Deployments

- **StatefulSets**: PostgreSQL, Redis, Redpanda (stateful, persistent storage)
- **Deployments**: Application services (stateless, scalable)

### Secrets Management

- **app-secrets**: Contains DATABASE_URL, KAFKA_BROKER, REDIS_ADDR, etc.
- **Type**: Opaque (base64 encoded)
- **Usage**: Environment variables via secretKeyRef

## Resilience Patterns

### Retry Logic

- **API Gateway**: Retries gRPC connection (5 attempts with exponential backoff)
- **Processor**: Retries Kafka message consumption on errors

### Health Checks

- **Liveness Probe**: HTTP GET on `/health` (if implemented)
- **Readiness Probe**: Ensures service is ready to accept traffic

### Error Handling

- **Graceful Degradation**: Cache miss falls back to database
- **Connection Pooling**: Prevents resource exhaustion
- **Timeout Handling**: Context-based timeouts (5 seconds for gRPC)

## Scalability Considerations

### Horizontal Scaling

- All application services are stateless and can scale horizontally
- Load balancer distributes traffic
- Consumer groups allow multiple processor instances

### Vertical Scaling

- Resource limits defined in K8s manifests
- Can be adjusted based on load

### Database Scaling

- Connection pooling handles concurrent connections
- Indexes on user_id and page_url for fast queries
- Consider read replicas for high read loads

## Security Considerations

### Current Implementation

- Secrets stored in Kubernetes Secrets (not in code)
- Internal service communication (no external exposure)
- Database credentials in environment variables

### Future Enhancements

- TLS/SSL for gRPC communication
- Service mesh (Istio/Linkerd) for mTLS
- RBAC for Kubernetes access
- Network policies for pod-to-pod communication

## Monitoring & Observability

### Current State

- Basic logging to stdout
- Kubernetes log aggregation

### Future Enhancements

- Prometheus metrics export
- Grafana dashboards
- Distributed tracing (Jaeger/Zipkin)
- Structured logging (JSON format)

## Performance Characteristics

- **Ingestion Latency**: < 10ms (Kafka publish)
- **Processing Latency**: < 100ms (database write)
- **Query Latency**: < 10ms (cached), < 50ms (database)
- **Throughput**: 1000+ events/second (depends on infrastructure)

## Deployment Strategies

### Blue-Green Deployment

- Can be implemented with Kubernetes Services
- Route traffic between old and new versions

### Rolling Updates

- Kubernetes default behavior
- Gradual rollout with health checks

### Canary Releases

- Traffic splitting with Service Mesh
- Gradual rollout to percentage of users


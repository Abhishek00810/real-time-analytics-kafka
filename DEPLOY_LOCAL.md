# Deploy to Local Kubernetes (Kind)

## Prerequisites ✅
- ✅ Kind cluster created: `analytics-cluster`
- ✅ kubectl configured
- ✅ Docker running

## Deployment Steps

### Step 1: Create Namespaces
```bash
kubectl create namespace data-layer
kubectl create namespace app-layer
```

### Step 2: Deploy Infrastructure (Data Layer)
Deploy in this order:

```bash
# 1. PostgreSQL
kubectl apply -f k8s/postgres.yaml

# 2. Redis
kubectl apply -f k8s/redis.yaml

# 3. Redpanda (Kafka)
kubectl apply -f k8s/redpanda.yaml
```

**Wait for infrastructure to be ready:**
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n data-layer --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n data-layer --timeout=300s
kubectl wait --for=condition=ready pod -l app=redpanda -n data-layer --timeout=300s
```

### Step 3: Initialize Database
```bash
# Get PostgreSQL pod name
PG_POD=$(kubectl get pod -n data-layer -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Copy init.sql to pod
kubectl cp infra/init.sql data-layer/$PG_POD:/tmp/init.sql

# Execute init.sql
kubectl exec -n data-layer $PG_POD -- psql -U postgres -d events -f /tmp/init.sql
```

### Step 4: Deploy Applications (App Layer)
Deploy in this order:

```bash
# 1. Analytics (gRPC service)
kubectl apply -f k8s/analytics.yaml

# 2. Processor (Kafka consumer)
kubectl apply -f k8s/processor.yaml

# 3. Ingestion (Kafka producer)
kubectl apply -f k8s/ingestion.yaml

# 4. API Gateway (HTTP endpoint)
kubectl apply -f k8s/api-gateway.yaml
```

**Wait for applications to be ready:**
```bash
kubectl wait --for=condition=ready pod -l app=analytics-go-api -n app-layer --timeout=300s
kubectl wait --for=condition=ready pod -l app=processor-go-api -n app-layer --timeout=300s
kubectl wait --for=condition=ready pod -l app=ingestion-go-api -n app-layer --timeout=300s
kubectl wait --for=condition=ready pod -l app=api-gateway-go-api -n app-layer --timeout=300s
```

## Verify Deployment

### Check all pods are running:
```bash
kubectl get pods -n data-layer
kubectl get pods -n app-layer
```

### Check services:
```bash
kubectl get svc -n data-layer
kubectl get svc -n app-layer
```

### Get API Gateway NodePort:
```bash
kubectl get svc api-gateway-external -n app-layer
# Access via: http://localhost:<NODEPORT>/analytics/events?user_id=test&page_url=/home
```

## Test the Application

### 1. Ingest an event:
```bash
INGESTION_PORT=$(kubectl get svc ingestion-external -n app-layer -o jsonpath='{.spec.ports[0].nodePort}')
curl -X POST http://localhost:$INGESTION_PORT/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-1",
    "user_id": "user123",
    "event_type": "click",
    "page_url": "/home",
    "time_stamp": "2024-01-01T00:00:00Z"
  }'
```

### 2. Query analytics:
```bash
API_GATEWAY_PORT=$(kubectl get svc api-gateway-external -n app-layer -o jsonpath='{.spec.ports[0].nodePort}')
curl "http://localhost:$API_GATEWAY_PORT/analytics/events?user_id=user123&page_url=/home"
```

## View Logs

```bash
# Application logs
kubectl logs -f -l app=ingestion-go-api -n app-layer
kubectl logs -f -l app=processor-go-api -n app-layer
kubectl logs -f -l app=analytics-go-api -n app-layer
kubectl logs -f -l app=api-gateway-go-api -n app-layer

# Infrastructure logs
kubectl logs -f -l app=postgres -n data-layer
kubectl logs -f -l app=redis -n data-layer
kubectl logs -f -l app=redpanda -n data-layer
```

## Clean Up

### Delete all resources:
```bash
kubectl delete -f k8s/ --ignore-not-found=true
kubectl delete namespace data-layer app-layer --ignore-not-found=true
```

### Delete cluster:
```bash
kind delete cluster --name analytics-cluster
```

## Troubleshooting

### Pods not starting:
```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

### Check events:
```bash
kubectl get events -n data-layer --sort-by='.lastTimestamp'
kubectl get events -n app-layer --sort-by='.lastTimestamp'
```

### Restart a deployment:
```bash
kubectl rollout restart deployment <deployment-name> -n <namespace>
```


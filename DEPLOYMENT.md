# Deployment Guide

This guide covers deploying the Real-Time Analytics Platform to Kubernetes.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Docker images pushed to registry
- Access to cluster with appropriate permissions

## Quick Deployment

### 1. Deploy Infrastructure (Data Layer)

```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml

# Deploy Redis
kubectl apply -f k8s/redis.yaml

# Deploy Redpanda (Kafka)
kubectl apply -f k8s/redpanda.yaml

# Wait for services to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n data-layer --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n data-layer --timeout=300s
kubectl wait --for=condition=ready pod -l app=redpanda -n data-layer --timeout=300s
```

### 2. Initialize Database

```bash
# Apply database schema
kubectl exec -i -n data-layer postgres-0 -- psql -U abhishekdadwal -d events < infra/init.sql
```

### 3. Deploy Application Services

```bash
# Deploy Ingestion Service
kubectl apply -f k8s/ingestion.yaml

# Deploy Processor Service
kubectl apply -f k8s/processor.yaml

# Deploy Analytics Service
kubectl apply -f k8s/analytics.yaml

# Deploy API Gateway
kubectl apply -f k8s/api-gateway.yaml

# Wait for deployments
kubectl wait --for=condition=available deployment -n app-layer --all --timeout=300s
```

## Verification

### Check Pod Status

```bash
# Check all pods
kubectl get pods -n app-layer
kubectl get pods -n data-layer

# Check service status
kubectl get svc -n app-layer
kubectl get svc -n data-layer
```

### Test Ingestion

```bash
# Get NodePort (or use port-forward)
INGESTION_PORT=$(kubectl get svc ingestion-external -n app-layer -o jsonpath='{.spec.ports[0].nodePort}')

# Ingest an event
curl -X POST http://localhost:${INGESTION_PORT}/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test_123",
    "user_id": "user_1",
    "event_type": "click",
    "page_url": "https://example.com",
    "time_stamp": "2025-11-05T20:00:00Z"
  }'
```

### Test Analytics

```bash
# Get API Gateway NodePort
API_GATEWAY_PORT=$(kubectl get svc api-gateway-external -n app-layer -o jsonpath='{.spec.ports[0].nodePort}')

# Query analytics (wait 5 seconds after ingestion)
curl -X GET http://localhost:${API_GATEWAY_PORT}/analytics/events \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_1", "page_url": "https://example.com"}'
```

## Configuration

### Environment Variables

All services use Kubernetes Secrets for configuration. Secrets are defined in each service's YAML file:

- `DATABASE_URL`: PostgreSQL connection string
- `KAFKA_BROKER`: Redpanda broker address
- `KAFKA_TOPIC`: Kafka topic name
- `REDIS_ADDR`: Redis connection address

### Updating Secrets

```bash
# Edit secret
kubectl edit secret app-secrets -n app-layer

# Or apply new secret YAML
kubectl apply -f k8s/app-secrets.yaml

# Restart deployments to pick up changes
kubectl rollout restart deployment -n app-layer
```

## Scaling

### Horizontal Scaling

```bash
# Scale ingestion service
kubectl scale deployment ingestion-deployment -n app-layer --replicas=3

# Scale processor service
kubectl scale deployment processor-deployment -n app-layer --replicas=3

# Scale analytics service
kubectl scale deployment analytics-deployment -n app-layer --replicas=3

# Scale API gateway
kubectl scale deployment api-gateway-deployment -n app-layer --replicas=3
```

### Auto Scaling (HPA)

```bash
# Create HPA for API Gateway
kubectl autoscale deployment api-gateway-deployment -n app-layer \
  --cpu-percent=70 \
  --min=2 \
  --max=10
```

## Updates & Rollouts

### Rolling Update

```bash
# Update image
kubectl set image deployment/analytics-deployment \
  analytics-go-api=dadwalabhishek/analytics-service:v1.1 \
  -n app-layer

# Monitor rollout
kubectl rollout status deployment/analytics-deployment -n app-layer

# Rollback if needed
kubectl rollout undo deployment/analytics-deployment -n app-layer
```

## Troubleshooting

### Check Pod Logs

```bash
# View logs for a specific service
kubectl logs -n app-layer -l app=analytics-go-api --tail=100

# Follow logs
kubectl logs -n app-layer -l app=analytics-go-api -f
```

### Check Service Connectivity

```bash
# Test from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -O- http://analytics.app-layer.svc.cluster.local:50051

# Test Redis connectivity
kubectl run -it --rm debug --image=redis:7-alpine --restart=Never -- \
  redis-cli -h redis.data-layer.svc.cluster.local ping
```

### Check Resource Usage

```bash
# View resource usage
kubectl top pods -n app-layer
kubectl top pods -n data-layer

# Describe pod for events
kubectl describe pod <pod-name> -n app-layer
```

## Production Considerations

### Resource Limits

Adjust resource requests/limits in manifests based on load:

```yaml
resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
  limits:
    cpu: "1000m"
    memory: "1Gi"
```

### Persistent Storage

Ensure PVCs are properly configured for StatefulSets:

```bash
# Check PVC status
kubectl get pvc -n data-layer
```

### Network Policies

Consider adding network policies to restrict pod-to-pod communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-gateway-policy
  namespace: app-layer
spec:
  podSelector:
    matchLabels:
      app: api-gateway-go-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 8081
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: analytics-go-api
    ports:
    - protocol: TCP
      port: 50051
```

## Cleanup

```bash
# Delete application services
kubectl delete -f k8s/api-gateway.yaml
kubectl delete -f k8s/analytics.yaml
kubectl delete -f k8s/processor.yaml
kubectl delete -f k8s/ingestion.yaml

# Delete infrastructure (CAUTION: This deletes data)
kubectl delete -f k8s/redpanda.yaml
kubectl delete -f k8s/redis.yaml
kubectl delete -f k8s/postgres.yaml

# Delete namespaces
kubectl delete namespace app-layer
kubectl delete namespace data-layer
```


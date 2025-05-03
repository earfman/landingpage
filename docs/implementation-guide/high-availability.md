# High Availability Deployment

This guide provides essential information for deploying ZeroTrustKerberosLink in a high availability configuration.

## Overview

A high availability (HA) deployment ensures continuous operation of ZeroTrustKerberosLink even if individual components fail. This guide covers the key aspects of setting up a resilient deployment.

## Architecture

### Basic HA Architecture

```
                          ┌─────────────────┐
                          │                 │
                          │  Load Balancer  │
                          │                 │
                          └────────┬────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
        ┌────────▼─────┐  ┌────────▼─────┐  ┌────────▼─────┐
        │              │  │              │  │              │
        │ ZeroTrust    │  │ ZeroTrust    │  │ ZeroTrust    │
        │ Instance 1   │  │ Instance 2   │  │ Instance 3   │
        │              │  │              │  │              │
        └────────┬─────┘  └────────┬─────┘  └────────┬─────┘
                 │                 │                 │
                 └─────────────────┼─────────────────┘
                                   │
                          ┌────────▼────────┐
                          │                 │
                          │  Redis Cluster  │
                          │                 │
                          └─────────────────┘
```

## Key Components

### Load Balancer

- **Type**: Application Load Balancer (ALB) or NGINX
- **Configuration**:
  - Health check path: `/health`
  - SSL termination (optional)
  - Session stickiness (not required)

### ZeroTrustKerberosLink Instances

- **Minimum**: 3 instances across different availability zones
- **Configuration**: Identical configuration on all instances
- **Scaling**: Auto-scaling based on CPU and request metrics

### Shared Redis Cache

- **Type**: Redis Cluster with replication
- **Configuration**:
  - TLS enabled
  - Authentication required
  - Automatic failover

## Deployment Options

### Docker Swarm

```bash
# Create Docker Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.ha.yml zerotrustkerberos
```

Example `docker-compose.ha.yml`:

```yaml
version: '3.8'
services:
  zerotrustkerberos:
    image: zerotrustkerberos/kerberos-aws-proxy:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    volumes:
      - /etc/zerotrustkerberos:/etc/zerotrustkerberos
    environment:
      - ZEROTRUST_REDIS_HOST=redis
    ports:
      - "8080:8080"
  
  redis:
    image: redis:6-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"

volumes:
  redis-data:
```

### Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f zerotrustkerberos-namespace.yaml
kubectl apply -f zerotrustkerberos-configmap.yaml
kubectl apply -f zerotrustkerberos-secret.yaml
kubectl apply -f zerotrustkerberos-deployment.yaml
kubectl apply -f zerotrustkerberos-service.yaml
kubectl apply -f zerotrustkerberos-ingress.yaml
```

Example `zerotrustkerberos-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zerotrustkerberos
  namespace: zerotrustkerberos
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zerotrustkerberos
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
    type: RollingUpdate
  template:
    metadata:
      labels:
        app: zerotrustkerberos
    spec:
      containers:
      - name: zerotrustkerberos
        image: zerotrustkerberos/kerberos-aws-proxy:latest
        ports:
        - containerPort: 8080
        volumeMounts:
        - name: config
          mountPath: /etc/zerotrustkerberos/config.yaml
          subPath: config.yaml
        - name: secrets
          mountPath: /etc/zerotrustkerberos/krb5.keytab
          subPath: krb5.keytab
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: config
        configMap:
          name: zerotrustkerberos-config
      - name: secrets
        secret:
          secretName: zerotrustkerberos-secrets
```

## Configuration for High Availability

### Instance Configuration

```yaml
# config.yaml
server:
  host: "0.0.0.0"
  port: 8080
  workers: 4
  health_check:
    enabled: true
    endpoint: "/health"

redis:
  host: "redis.example.com"
  port: 6379
  use_tls: true
  connection_pool:
    max_connections: 20
    timeout: 5
  
session:
  store: "redis"
  distributed: true
```

### Redis Sentinel Configuration

For Redis high availability:

```yaml
redis:
  sentinel:
    enabled: true
    master_name: "zerotrustkerberos"
    nodes:
      - "redis-sentinel-0.example.com:26379"
      - "redis-sentinel-1.example.com:26379"
      - "redis-sentinel-2.example.com:26379"
```

## Backup and Recovery

### Configuration Backup

Back up configuration files regularly:

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/backup/zerotrustkerberos/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
cp -r /etc/zerotrustkerberos/* $BACKUP_DIR/
```

### Redis Backup

Configure Redis persistence and backups:

```bash
# Redis persistence configuration
appendonly yes
appendfsync everysec

# Backup Redis data
redis-cli -a $REDIS_PASSWORD --rdb /backup/redis-backup.rdb
```

## Monitoring

### Health Checks

Implement comprehensive health checks:

```yaml
monitoring:
  health_check:
    components:
      - name: "kerberos"
        endpoint: "/health/kerberos"
      - name: "aws"
        endpoint: "/health/aws"
      - name: "redis"
        endpoint: "/health/redis"
```

### Metrics

Configure Prometheus metrics for monitoring:

```yaml
monitoring:
  prometheus:
    enabled: true
    endpoint: "/metrics"
    include:
      - "auth_requests_total"
      - "auth_failures_total"
      - "aws_role_assumption_duration_seconds"
      - "http_request_duration_seconds"
```

## Failover Testing

Regularly test failover scenarios:

1. **Instance Failure**:
   - Terminate an instance and verify others handle the load
   - Test automatic recovery

2. **Redis Failure**:
   - Simulate Redis primary failure
   - Verify automatic failover to replica

3. **Network Partition**:
   - Simulate network issues between components
   - Verify system behavior during partition

## Next Steps

After implementing high availability:

1. Set up [Disaster Recovery](./disaster-recovery.md)
2. Configure [Monitoring and Alerting](./monitoring.md)
3. Implement [Auto-scaling](./auto-scaling.md)

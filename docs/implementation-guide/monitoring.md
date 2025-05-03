# Monitoring Guide

This guide explains how to implement comprehensive monitoring for ZeroTrustKerberosLink to ensure optimal performance, security, and reliability.

## Overview

Effective monitoring of ZeroTrustKerberosLink helps you:

- Detect and respond to security incidents
- Identify performance bottlenecks
- Ensure high availability
- Track usage patterns
- Verify compliance requirements

## Key Metrics

### Authentication Metrics

| Metric | Description | Normal Range |
|--------|-------------|--------------|
| `auth_requests_total` | Total authentication requests | Varies by usage |
| `auth_success_total` | Successful authentications | >95% of requests |
| `auth_failure_total` | Failed authentications | <5% of requests |
| `auth_latency_seconds` | Authentication request latency | <500ms |

### AWS Integration Metrics

| Metric | Description | Normal Range |
|--------|-------------|--------------|
| `aws_role_assumptions_total` | Total AWS role assumptions | Varies by usage |
| `aws_role_assumption_failures_total` | Failed role assumptions | <1% of attempts |
| `aws_role_assumption_latency_seconds` | Role assumption latency | <1000ms |
| `aws_api_errors_total` | AWS API errors | Near 0 |

### System Metrics

| Metric | Description | Normal Range |
|--------|-------------|--------------|
| `cpu_usage_percent` | CPU utilization | <70% |
| `memory_usage_bytes` | Memory usage | <80% of available |
| `disk_usage_percent` | Disk usage | <80% |
| `open_file_descriptors` | Open file descriptors | <80% of limit |

### Redis Metrics

| Metric | Description | Normal Range |
|--------|-------------|--------------|
| `redis_connections_total` | Total Redis connections | <80% of connection pool |
| `redis_operation_latency_seconds` | Redis operation latency | <50ms |
| `redis_errors_total` | Redis errors | Near 0 |
| `redis_cache_hit_ratio` | Cache hit ratio | >80% |

## Prometheus Integration

### Basic Configuration

Enable Prometheus metrics in `config.yaml`:

```yaml
monitoring:
  prometheus:
    enabled: true
    endpoint: "/metrics"
    port: 8080  # Same as main service port
```

### Prometheus Server Configuration

Add ZeroTrustKerberosLink as a scrape target:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'zerotrustkerberos'
    scrape_interval: 15s
    static_configs:
      - targets: ['zerotrustkerberos:8080']
```

For multiple instances with service discovery:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'zerotrustkerberos'
    scrape_interval: 15s
    consul_sd_configs:
      - server: 'consul:8500'
        services: ['zerotrustkerberos']
```

## Grafana Dashboards

### Dashboard Setup

1. Import the ZeroTrustKerberosLink dashboard:
   - Dashboard ID: `12345` (example)
   - Or import from JSON file

2. Connect to your Prometheus data source

### Key Dashboard Panels

1. **Authentication Overview**
   - Authentication success/failure rate
   - Authentication latency
   - Active sessions

2. **AWS Integration**
   - Role assumption success/failure rate
   - Role assumption latency
   - Most used AWS roles

3. **System Health**
   - CPU, memory, disk usage
   - Request rate
   - Error rate

4. **Security Monitoring**
   - Failed authentication attempts
   - Policy violations
   - Unusual access patterns

## Alert Configuration

### Critical Alerts

| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| High Authentication Failure Rate | `rate(auth_failure_total[5m]) / rate(auth_requests_total[5m]) > 0.1` | Critical | Investigate potential attack |
| Service Unavailable | `up{job="zerotrustkerberos"} == 0` | Critical | Restart service, check logs |
| High Latency | `histogram_quantile(0.95, auth_latency_seconds) > 1` | Warning | Check system resources, scaling |
| Redis Connection Failure | `redis_up == 0` | Critical | Check Redis connection, restart if needed |

### Prometheus Alert Rules

```yaml
# alerts.yml
groups:
- name: zerotrustkerberos
  rules:
  - alert: HighAuthFailureRate
    expr: rate(auth_failure_total[5m]) / rate(auth_requests_total[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High authentication failure rate"
      description: "Authentication failure rate is above 10% for 5 minutes"

  - alert: ServiceUnavailable
    expr: up{job="zerotrustkerberos"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "ZeroTrustKerberosLink service down"
      description: "Service has been down for more than 1 minute"
```

## Health Checks

### Health Check Endpoint

Configure the health check endpoint:

```yaml
server:
  health_check:
    enabled: true
    endpoint: "/health"
    include_details: true
```

### Health Check Components

The health check endpoint reports on:

1. **Service Status**: Overall service health
2. **Kerberos**: Kerberos authentication status
3. **AWS**: AWS API connectivity
4. **Redis**: Redis connection status
5. **System Resources**: CPU, memory, disk usage

Example health check response:

```json
{
  "status": "healthy",
  "version": "1.2.3",
  "timestamp": "2025-05-01T12:34:56Z",
  "uptime": "3d 12h 34m",
  "components": {
    "kerberos": {
      "status": "healthy",
      "details": "Kerberos authentication working"
    },
    "aws": {
      "status": "healthy",
      "details": "AWS API connection OK"
    },
    "redis": {
      "status": "healthy",
      "details": "Redis connection OK"
    },
    "system": {
      "status": "healthy",
      "cpu": "45%",
      "memory": "60%",
      "disk": "30%"
    }
  }
}
```

## Log Monitoring

### Log-Based Alerts

Configure log-based alerts for security events:

```yaml
logging:
  alerts:
    - name: "multiple_auth_failures"
      pattern: "authentication.*failed"
      threshold: 5
      window: "5m"
      notification: "email"
    
    - name: "admin_actions"
      pattern: "event_type.*admin"
      threshold: 1
      window: "1h"
      notification: "slack"
```

### Log Visualization

Use Kibana or Grafana Loki for log visualization:

1. **Authentication Dashboard**
   - Authentication events over time
   - Failed authentication sources
   - Authentication methods used

2. **Security Dashboard**
   - Policy violations
   - Administrative actions
   - Access patterns

## Notification Channels

### Email Notifications

Configure email alerts:

```yaml
notifications:
  email:
    enabled: true
    smtp_server: "smtp.example.com"
    smtp_port: 587
    use_tls: true
    from_address: "alerts@example.com"
    to_addresses:
      - "security@example.com"
      - "ops@example.com"
```

### Slack Notifications

Configure Slack alerts:

```yaml
notifications:
  slack:
    enabled: true
    webhook_url_file: "/etc/zerotrustkerberos/secrets/slack_webhook"
    channel: "#zerotrustkerberos-alerts"
    username: "ZeroTrustMonitor"
```

### PagerDuty Integration

Configure PagerDuty for critical alerts:

```yaml
notifications:
  pagerduty:
    enabled: true
    integration_key_file: "/etc/zerotrustkerberos/secrets/pagerduty_key"
    service_name: "ZeroTrustKerberosLink"
```

## Monitoring in Kubernetes

### Prometheus Operator

Use Prometheus Operator for Kubernetes monitoring:

1. Create a ServiceMonitor:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: zerotrustkerberos
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: zerotrustkerberos
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
```

2. Create a PrometheusRule:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: zerotrustkerberos-alerts
  namespace: monitoring
spec:
  groups:
  - name: zerotrustkerberos
    rules:
    - alert: HighAuthFailureRate
      expr: rate(auth_failure_total[5m]) / rate(auth_requests_total[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High authentication failure rate"
```

### Kubernetes Liveness Probe

Configure Kubernetes liveness probe:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

## Capacity Planning

### Metrics for Scaling

Monitor these metrics for capacity planning:

1. **Request Rate**: Requests per second
2. **CPU Usage**: When consistently >70%, consider scaling
3. **Memory Usage**: When consistently >80%, consider scaling
4. **Authentication Latency**: When P95 >500ms, consider scaling

### Auto-scaling Configuration

Configure auto-scaling based on metrics:

```yaml
# Kubernetes HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: zerotrustkerberos
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: zerotrustkerberos
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Security Monitoring

### Security-Focused Metrics

Monitor these security-focused metrics:

1. **Authentication Failures**: By source IP, user, time
2. **Policy Violations**: Attempts to access unauthorized resources
3. **Role Assumption Patterns**: Unusual role assumption behavior
4. **Geographic Access**: Access from unusual locations
5. **Time-based Access**: Access outside normal hours

### Security Dashboard

Create a security-focused dashboard with:

1. **Authentication Heatmap**: By time and source
2. **Top Failed Users**: Users with most failures
3. **Geographic Access Map**: Where access is coming from
4. **Role Usage**: Which AWS roles are being used
5. **Policy Violations**: Attempts to violate policies

## Best Practices

### Monitoring Best Practices

1. **Comprehensive Coverage**: Monitor all critical components
2. **Appropriate Thresholds**: Set realistic alert thresholds
3. **Alert Fatigue**: Avoid too many alerts by tuning thresholds
4. **Correlation**: Correlate metrics with logs for context
5. **Historical Data**: Retain historical data for trend analysis
6. **Regular Review**: Review dashboards and alerts regularly
7. **Documentation**: Document monitoring setup and procedures

### Security Monitoring Best Practices

1. **Baseline Behavior**: Establish normal behavior patterns
2. **Anomaly Detection**: Alert on deviations from normal
3. **Context Awareness**: Include context in security alerts
4. **Rapid Response**: Define procedures for security alerts
5. **Regular Testing**: Test monitoring and alerting regularly

## Related Documentation

- [Implementation Guide](./index.md)
- [High Availability](./high-availability.md)
- [Audit Logging](./audit-logging.md)
- [Security Hardening](../security-hardening/index.md)

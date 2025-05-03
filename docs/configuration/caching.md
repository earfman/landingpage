# Caching Configuration

ZeroTrustKerberosLink implements a comprehensive caching system to improve performance while maintaining security. This guide explains how to configure and optimize caching for your deployment.

## Cache Storage Options

ZeroTrustKerberosLink supports multiple cache storage backends:

### Redis Cache

Redis is the recommended cache storage backend for production deployments:

```yaml
cache:
  store: "redis"
  redis:
    host: "localhost"
    port: 6379
    db: 1  # Use a different DB than sessions
    password_env: "REDIS_PASSWORD"
    tls:
      enabled: true
      cert_file: "/etc/zerotrustkerberos/certs/redis-cert.pem"
      key_file: "/etc/zerotrustkerberos/certs/redis-key.pem"
      ca_file: "/etc/zerotrustkerberos/certs/ca.pem"
```

### In-Memory Cache

For development or testing, in-memory storage can be used:

```yaml
cache:
  store: "memory"
  memory:
    max_size: "100MB"
    eviction_policy: "lru"
```

## Cache Configuration

### Global Cache Settings

Configure global cache behavior:

```yaml
cache:
  enabled: true
  default_ttl: "5m"  # Default time-to-live for cache entries
  negative_ttl: "1m"  # Time-to-live for negative cache entries
  refresh_before_expiry: "30s"  # Refresh cache entries before they expire
```

### Cache Keys

Configure how cache keys are generated:

```yaml
cache:
  key_prefix: "zerotrustkerberos:"
  include_version: true  # Include application version in cache keys
  include_config_hash: true  # Include configuration hash in cache keys
```

## Cacheable Resources

ZeroTrustKerberosLink caches several types of resources:

### AWS IAM Role Cache

```yaml
cache:
  aws_roles:
    enabled: true
    ttl: "5m"
    max_size: 1000
```

### Kerberos Principal Cache

```yaml
cache:
  kerberos_principals:
    enabled: true
    ttl: "10m"
    max_size: 5000
```

### AWS STS Credentials Cache

```yaml
cache:
  aws_credentials:
    enabled: true
    ttl: "15m"  # Should be less than credential expiration
    max_size: 1000
```

### Role Mapping Cache

```yaml
cache:
  role_mappings:
    enabled: true
    ttl: "5m"
    max_size: 1000
```

## Cache Invalidation

Configure how cache invalidation is handled:

```yaml
cache:
  invalidation:
    on_config_change: true  # Invalidate cache when configuration changes
    on_role_mapping_change: true  # Invalidate cache when role mappings change
    on_error_threshold: 5  # Invalidate cache after 5 errors
```

## High Availability Considerations

For high availability deployments:

```yaml
cache:
  store: "redis"
  redis:
    cluster:
      enabled: true
      nodes:
        - host: "redis-1.example.com"
          port: 6379
        - host: "redis-2.example.com"
          port: 6379
        - host: "redis-3.example.com"
          port: 6379
    sentinel:
      enabled: false
```

## Security Considerations

When configuring caching, follow these best practices:

<div class="security-feature">
  <h4>Use Redis with TLS</h4>
  <p>Store cache data in Redis with TLS encryption enabled to protect sensitive data in transit.</p>
</div>

<div class="security-feature">
  <h4>Set Appropriate TTLs</h4>
  <p>Configure cache TTLs based on security requirements and data sensitivity.</p>
</div>

<div class="security-feature">
  <h4>Separate Cache from Sessions</h4>
  <p>Use different Redis databases or instances for cache and session data.</p>
</div>

<div class="security-feature">
  <h4>Encrypt Sensitive Cache Data</h4>
  <p>Enable encryption for sensitive cache data, such as credentials.</p>
</div>

<div class="security-feature">
  <h4>Implement Cache Invalidation</h4>
  <p>Invalidate cache entries when configuration changes or errors occur.</p>
</div>

## Performance Tuning

Optimize cache performance with these settings:

```yaml
cache:
  performance:
    connection_pool:
      max_connections: 10
      min_idle: 2
      max_idle: 5
    compression:
      enabled: true
      algorithm: "gzip"
      min_size: 1024  # Only compress entries larger than 1KB
```

## Monitoring Cache Performance

ZeroTrustKerberosLink provides metrics for monitoring cache performance:

- **Hit Rate**: Percentage of cache hits
- **Miss Rate**: Percentage of cache misses
- **Latency**: Time to retrieve data from cache
- **Size**: Current cache size
- **Evictions**: Number of cache evictions

These metrics are available through the monitoring endpoints. See the [Monitoring Guide](../implementation-guide/monitoring.md) for details.

## Related Documentation

- [Secure Redis](../security-hardening/secure-redis.md)
- [High Availability](../implementation-guide/high-availability.md)
- [Monitoring](../implementation-guide/monitoring.md)

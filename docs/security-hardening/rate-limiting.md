# Rate Limiting

ZeroTrustKerberosLink implements comprehensive rate limiting to protect against abuse, denial of service attacks, and brute force attempts while ensuring service availability.

## Rate Limiting Implementation

Rate limiting in ZeroTrustKerberosLink is implemented at multiple levels:

1. **API Rate Limiting**: Limits requests to the API endpoints
2. **Authentication Rate Limiting**: Limits authentication attempts
3. **AWS API Rate Limiting**: Manages AWS API request rates
4. **IP-based Rate Limiting**: Limits requests from specific IP addresses

## Configuration

### Basic Rate Limiting Configuration

```yaml
security:
  rate_limiting:
    enabled: true
    default_limit: 60  # Requests per minute
    default_burst: 10  # Burst capacity
    response_code: 429  # Too Many Requests
    include_headers: true  # Include rate limit headers in responses
```

### Endpoint-Specific Rate Limits

Configure different rate limits for specific endpoints:

```yaml
security:
  rate_limiting:
    endpoints:
      - path: "/auth/*"
        limit: 30  # Requests per minute
        burst: 5   # Burst capacity
      
      - path: "/config/*"
        limit: 20
        burst: 3
      
      - path: "/health"
        limit: 120
        burst: 20
```

### Authentication Rate Limiting

Configure rate limits for authentication attempts:

```yaml
security:
  rate_limiting:
    authentication:
      limit: 5  # Authentication attempts per minute
      burst: 2  # Burst capacity
      lockout:
        enabled: true
        threshold: 10  # Failed attempts before lockout
        duration: "30m"  # Lockout duration
```

### IP-Based Rate Limiting

Configure rate limits based on IP addresses:

```yaml
security:
  rate_limiting:
    ip_based:
      enabled: true
      limit: 100  # Requests per minute per IP
      burst: 20   # Burst capacity
      whitelist:
        - "10.0.0.0/8"  # Internal network exempt from rate limiting
        - "172.16.0.0/12"
```

### Storage Configuration

Configure how rate limit data is stored:

```yaml
security:
  rate_limiting:
    storage:
      type: "redis"  # Options: memory, redis
      redis:
        host: "localhost"
        port: 6379
        db: 2  # Use a different DB than sessions and cache
        key_prefix: "ratelimit:"
        tls:
          enabled: true
```

## Response Headers

When rate limiting is enabled, ZeroTrustKerberosLink includes the following headers in API responses:

- **X-RateLimit-Limit**: The maximum number of requests allowed per minute
- **X-RateLimit-Remaining**: The number of requests remaining in the current window
- **X-RateLimit-Reset**: The time when the current rate limit window resets (Unix timestamp)
- **Retry-After**: When rate limited, the number of seconds to wait before retrying

Example response headers:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1619123456
Retry-After: 30
```

## Rate Limiting Algorithms

ZeroTrustKerberosLink supports multiple rate limiting algorithms:

### Token Bucket Algorithm

The default algorithm is token bucket, which provides:

- Consistent rate limiting with burst capacity
- Smooth handling of traffic spikes
- Efficient implementation

```yaml
security:
  rate_limiting:
    algorithm: "token_bucket"
    token_bucket:
      refill_interval: "1s"  # Token refill interval
```

### Fixed Window Algorithm

An alternative algorithm is fixed window:

```yaml
security:
  rate_limiting:
    algorithm: "fixed_window"
    fixed_window:
      window_size: "1m"  # Window size
```

### Sliding Window Algorithm

For more precise rate limiting, sliding window can be used:

```yaml
security:
  rate_limiting:
    algorithm: "sliding_window"
    sliding_window:
      window_size: "1m"  # Window size
      precision: 6  # Number of sub-windows
```

## Monitoring Rate Limiting

ZeroTrustKerberosLink provides metrics for monitoring rate limiting:

- **Rate Limit Hits**: Number of requests that hit rate limits
- **Rate Limit Near Misses**: Number of requests that nearly hit rate limits
- **Rate Limit by Endpoint**: Rate limit hits by endpoint
- **Rate Limit by IP**: Rate limit hits by IP address

These metrics are available through the monitoring endpoints. See the [Monitoring Guide](../implementation-guide/monitoring.md) for details.

## Security Considerations

When configuring rate limiting, follow these best practices:

<div class="security-feature">
  <h4>Set Appropriate Limits</h4>
  <p>Configure rate limits based on expected legitimate traffic patterns and resource capacity.</p>
</div>

<div class="security-feature">
  <h4>Prioritize Authentication Endpoints</h4>
  <p>Apply stricter rate limits to authentication endpoints to prevent brute force attacks.</p>
</div>

<div class="security-feature">
  <h4>Use Redis for Storage</h4>
  <p>In production environments, use Redis for rate limit storage to ensure consistency across multiple instances.</p>
</div>

<div class="security-feature">
  <h4>Include Rate Limit Headers</h4>
  <p>Include rate limit headers in responses to help clients adapt their request rates.</p>
</div>

<div class="security-feature">
  <h4>Monitor Rate Limit Hits</h4>
  <p>Monitor rate limit hits to detect potential attacks and adjust limits as needed.</p>
</div>

## Troubleshooting

Common rate limiting issues include:

| Issue | Possible Causes | Resolution |
|-------|-----------------|------------|
| Legitimate users hitting rate limits | Limits too restrictive | Adjust rate limits or whitelist IP ranges |
| Rate limits not enforced | Misconfiguration, storage issues | Verify configuration, check Redis connectivity |
| Inconsistent rate limiting | Multiple instances without shared storage | Configure Redis for rate limit storage |
| High latency due to rate limiting | Inefficient algorithm, storage issues | Optimize algorithm, check Redis performance |

## Related Documentation

- [Input Validation](./input-validation.md)
- [Security Headers](./security-headers.md)
- [Monitoring](../implementation-guide/monitoring.md)
- [High Availability](../implementation-guide/high-availability.md)

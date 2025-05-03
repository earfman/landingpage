# Session Configuration

ZeroTrustKerberosLink implements secure session management to maintain user authentication state while adhering to security best practices.

## Session Storage

ZeroTrustKerberosLink supports multiple session storage backends:

### Redis Session Storage

Redis is the recommended session storage backend for production deployments:

```yaml
session:
  store: "redis"
  redis:
    host: "localhost"
    port: 6379
    db: 0
    password_env: "REDIS_PASSWORD"
    tls:
      enabled: true
      cert_file: "/etc/zerotrustkerberos/certs/redis-cert.pem"
      key_file: "/etc/zerotrustkerberos/certs/redis-key.pem"
      ca_file: "/etc/zerotrustkerberos/certs/ca.pem"
```

### In-Memory Session Storage

For development or testing, in-memory storage can be used:

```yaml
session:
  store: "memory"
  memory:
    max_entries: 10000
    cleanup_interval: "5m"
```

## Session Cookie Configuration

Configure how session cookies are handled:

```yaml
session:
  cookie:
    name: "zerotrustkerberos_session"
    secure: true
    http_only: true
    same_site: "strict"
    max_age: 28800  # 8 hours in seconds
    domain: "example.com"  # Optional
    path: "/"
```

### Security Settings

<div class="security-feature">
  <h4>Secure Flag</h4>
  <p>The <code>secure</code> flag ensures cookies are only sent over HTTPS connections, preventing exposure over insecure channels.</p>
</div>

<div class="security-feature">
  <h4>HttpOnly Flag</h4>
  <p>The <code>http_only</code> flag prevents JavaScript from accessing the cookie, mitigating XSS attacks.</p>
</div>

<div class="security-feature">
  <h4>SameSite Setting</h4>
  <p>The <code>same_site</code> setting controls how cookies are sent in cross-site requests, protecting against CSRF attacks.</p>
</div>

## Session Timeouts

Configure session timeout behavior:

```yaml
session:
  idle_timeout: "30m"     # Session expires after 30 minutes of inactivity
  absolute_timeout: "8h"  # Session expires after 8 hours regardless of activity
  refresh_threshold: "15m" # Refresh session if less than 15 minutes remaining
```

## Session Content

Configure what information is stored in the session:

```yaml
session:
  content:
    include_user_info: true
    include_groups: true
    include_roles: true
    include_aws_account_info: true
```

## Session Encryption

Configure encryption for session data:

```yaml
session:
  encryption:
    enabled: true
    algorithm: "AES-256-GCM"
    key_env: "SESSION_ENCRYPTION_KEY"
    key_rotation:
      enabled: true
      interval: "168h"  # 7 days
```

## Session Validation

Configure how sessions are validated:

```yaml
session:
  validation:
    validate_ip: true
    validate_user_agent: true
    validate_fingerprint: true
```

## High Availability Considerations

For high availability deployments:

```yaml
session:
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

When configuring sessions, follow these best practices:

<div class="security-feature">
  <h4>Use Redis with TLS</h4>
  <p>Store sessions in Redis with TLS encryption enabled to protect session data in transit.</p>
</div>

<div class="security-feature">
  <h4>Enable Cookie Security Flags</h4>
  <p>Always enable the Secure, HttpOnly, and SameSite flags for session cookies.</p>
</div>

<div class="security-feature">
  <h4>Set Appropriate Timeouts</h4>
  <p>Configure session timeouts based on security requirements and user experience considerations.</p>
</div>

<div class="security-feature">
  <h4>Encrypt Session Data</h4>
  <p>Enable encryption for session data to protect sensitive information.</p>
</div>

<div class="security-feature">
  <h4>Implement Session Validation</h4>
  <p>Validate session integrity by checking IP address, user agent, or other contextual information.</p>
</div>

## Related Documentation

- [Authentication Configuration](./authentication.md)
- [Secure Redis](../security-hardening/secure-redis.md)
- [High Availability](../implementation-guide/high-availability.md)

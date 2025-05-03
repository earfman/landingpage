# Configuration Guide

This guide provides comprehensive instructions for configuring ZeroTrustKerberosLink after installation. Proper configuration is essential for ensuring secure operation and optimal performance.

## Configuration Overview

ZeroTrustKerberosLink uses a layered configuration approach:

1. **Base Configuration**: Core settings in the main configuration file
2. **Environment-Specific Configuration**: Settings that vary by environment
3. **Secret Configuration**: Sensitive values stored securely
4. **Dynamic Configuration**: Settings that can be changed at runtime

## Configuration File Locations

The default configuration file locations are:

| File | Purpose | Path |
|------|---------|------|
| Main Configuration | Core settings | `/etc/zerotrust/config.yaml` |
| Environment Config | Environment-specific settings | `/etc/zerotrust/env/[environment].yaml` |
| Secrets | Sensitive values | Managed by secrets provider |
| Logging Config | Logging settings | `/etc/zerotrust/logging.yaml` |

## Configuration Format

ZeroTrustKerberosLink supports configuration in YAML, JSON, or TOML formats. YAML is recommended for readability.

### Example Configuration (YAML)

```yaml
# ZeroTrustKerberosLink Configuration

# Server configuration
server:
  host: 0.0.0.0
  port: 443
  workers: 4
  max_requests: 1000
  timeout: 30
  tls:
    enabled: true
    cert_file: /etc/zerotrust/tls/server.crt
    key_file: /etc/zerotrust/tls/server.key
    min_version: TLSv1.2
    ciphers:
      - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
      - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256

# Authentication configuration
authentication:
  kerberos:
    enabled: true
    service_principal: HTTP/zerotrust.example.com@EXAMPLE.COM
    keytab_file: /etc/zerotrust/kerberos/zerotrust.keytab
    realm: EXAMPLE.COM
    kdc: kdc.example.com
    admin_server: kdc.example.com
    renewable: true
    forwardable: false
  
  session:
    provider: redis
    expiration: 3600
    renewal_window: 300
    max_lifetime: 86400
    inactivity_timeout: 1800
    
# AWS configuration
aws:
  default_region: us-west-2
  sts_endpoint: https://sts.us-west-2.amazonaws.com
  role_session_name: ZeroTrustKerberos
  credential_duration: 3600
  assume_role_policy: /etc/zerotrust/policies/assume_role_policy.json
  external_id_secret: ${AWS_EXTERNAL_ID}
  
# Role mapping configuration
role_mapping:
  provider: file
  mapping_file: /etc/zerotrust/role_mappings.yaml
  refresh_interval: 300
  default_roles:
    - arn:aws:iam::123456789012:role/ReadOnly
  
# Redis configuration
redis:
  host: redis.example.com
  port: 6379
  db: 0
  password: ${REDIS_PASSWORD}
  tls:
    enabled: true
    cert_file: /etc/zerotrust/tls/redis-client.crt
    key_file: /etc/zerotrust/tls/redis-client.key
    ca_file: /etc/zerotrust/tls/ca.crt
  pool:
    max_connections: 10
    min_connections: 2
    connection_timeout: 10
    
# Security configuration
security:
  headers:
    content_security_policy: "default-src 'self'; script-src 'self'; object-src 'none'"
    strict_transport_security: "max-age=31536000; includeSubDomains"
    x_content_type_options: "nosniff"
    x_frame_options: "DENY"
    x_xss_protection: "1; mode=block"
    referrer_policy: "strict-origin-when-cross-origin"
    permissions_policy: "geolocation=(), microphone=(), camera=()"
    
  rate_limiting:
    enabled: true
    rate: 100
    period: 60
    by_user: true
    by_ip: true
    
  input_validation:
    strict_mode: true
    sanitize_html: true
    prevent_path_traversal: true
    
# Logging configuration
logging:
  level: INFO
  format: json
  output: file
  file: /var/log/zerotrust/zerotrust.log
  max_size: 100MB
  max_files: 10
  syslog:
    enabled: false
    facility: local0
  
# Monitoring configuration
monitoring:
  metrics:
    enabled: true
    port: 9090
    path: /metrics
  health:
    enabled: true
    port: 8080
    path: /health
  tracing:
    enabled: false
    provider: jaeger
    endpoint: http://jaeger:14268/api/traces
    
# Secrets management
secrets:
  provider: file
  file: /etc/zerotrust/secrets.yaml
  # Alternative providers: hashicorp, aws, azure
  
# Advanced configuration
advanced:
  debug_mode: false
  profiling: false
  thread_pool_size: 8
  connection_draining_timeout: 30
  graceful_shutdown_timeout: 60
```

## Core Configuration Sections

### Server Configuration

The `server` section configures the HTTP/HTTPS server:

```yaml
server:
  host: 0.0.0.0  # Listen on all interfaces
  port: 443      # HTTPS port
  workers: 4     # Number of worker processes
  max_requests: 1000  # Maximum concurrent requests
  timeout: 30    # Request timeout in seconds
```

#### TLS Configuration

```yaml
server:
  tls:
    enabled: true
    cert_file: /etc/zerotrust/tls/server.crt
    key_file: /etc/zerotrust/tls/server.key
    min_version: TLSv1.2
    ciphers:
      - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
      - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
```

### Authentication Configuration

#### Kerberos Authentication

```yaml
authentication:
  kerberos:
    enabled: true
    service_principal: HTTP/zerotrust.example.com@EXAMPLE.COM
    keytab_file: /etc/zerotrust/kerberos/zerotrust.keytab
    realm: EXAMPLE.COM
    kdc: kdc.example.com
    admin_server: kdc.example.com
    renewable: true
    forwardable: false
```

#### Session Management

```yaml
authentication:
  session:
    provider: redis
    expiration: 3600  # Session expiration in seconds
    renewal_window: 300  # Time before expiration when session can be renewed
    max_lifetime: 86400  # Maximum session lifetime in seconds
    inactivity_timeout: 1800  # Timeout for inactive sessions
```

### AWS Configuration

```yaml
aws:
  default_region: us-west-2
  sts_endpoint: https://sts.us-west-2.amazonaws.com
  role_session_name: ZeroTrustKerberos
  credential_duration: 3600  # Duration of temporary credentials in seconds
  assume_role_policy: /etc/zerotrust/policies/assume_role_policy.json
  external_id_secret: ${AWS_EXTERNAL_ID}
```

### Role Mapping Configuration

```yaml
role_mapping:
  provider: file
  mapping_file: /etc/zerotrust/role_mappings.yaml
  refresh_interval: 300  # Refresh interval in seconds
  default_roles:
    - arn:aws:iam::123456789012:role/ReadOnly
```

Example role mapping file (`role_mappings.yaml`):

```yaml
mappings:
  - principal: "user1@EXAMPLE.COM"
    roles:
      - arn:aws:iam::123456789012:role/Developer
      - arn:aws:iam::123456789012:role/ReadOnly
  
  - principal: "admin@EXAMPLE.COM"
    roles:
      - arn:aws:iam::123456789012:role/Administrator
  
  - group: "developers"
    roles:
      - arn:aws:iam::123456789012:role/Developer
  
  - realm: "PARTNER.COM"
    roles:
      - arn:aws:iam::123456789012:role/Partner
```

### Redis Configuration

```yaml
redis:
  host: redis.example.com
  port: 6379
  db: 0
  password: ${REDIS_PASSWORD}
  tls:
    enabled: true
    cert_file: /etc/zerotrust/tls/redis-client.crt
    key_file: /etc/zerotrust/tls/redis-client.key
    ca_file: /etc/zerotrust/tls/ca.crt
  pool:
    max_connections: 10
    min_connections: 2
    connection_timeout: 10
```

### Security Configuration

#### Security Headers

```yaml
security:
  headers:
    content_security_policy: "default-src 'self'; script-src 'self'; object-src 'none'"
    strict_transport_security: "max-age=31536000; includeSubDomains"
    x_content_type_options: "nosniff"
    x_frame_options: "DENY"
    x_xss_protection: "1; mode=block"
    referrer_policy: "strict-origin-when-cross-origin"
    permissions_policy: "geolocation=(), microphone=(), camera=()"
```

#### Rate Limiting

```yaml
security:
  rate_limiting:
    enabled: true
    rate: 100  # Requests per period
    period: 60  # Period in seconds
    by_user: true  # Rate limit by user
    by_ip: true  # Rate limit by IP
```

#### Input Validation

```yaml
security:
  input_validation:
    strict_mode: true
    sanitize_html: true
    prevent_path_traversal: true
```

### Logging Configuration

```yaml
logging:
  level: INFO  # Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
  format: json  # Log format (json, text)
  output: file  # Output destination (file, stdout, syslog)
  file: /var/log/zerotrust/zerotrust.log
  max_size: 100MB  # Maximum log file size
  max_files: 10  # Maximum number of log files to keep
  syslog:
    enabled: false
    facility: local0
```

### Monitoring Configuration

```yaml
monitoring:
  metrics:
    enabled: true
    port: 9090
    path: /metrics
  health:
    enabled: true
    port: 8080
    path: /health
  tracing:
    enabled: false
    provider: jaeger
    endpoint: http://jaeger:14268/api/traces
```

### Secrets Management

```yaml
secrets:
  provider: file
  file: /etc/zerotrust/secrets.yaml
  # Alternative providers: hashicorp, aws, azure
```

## Environment Variables

ZeroTrustKerberosLink supports configuration via environment variables. Environment variables override values in configuration files.

Environment variables use the following naming convention:

```
ZEROTRUST_<SECTION>_<KEY>
```

Examples:

```bash
# Server configuration
export ZEROTRUST_SERVER_PORT=443
export ZEROTRUST_SERVER_WORKERS=4

# AWS configuration
export ZEROTRUST_AWS_DEFAULT_REGION=us-west-2
export ZEROTRUST_AWS_CREDENTIAL_DURATION=3600

# Redis configuration
export ZEROTRUST_REDIS_HOST=redis.example.com
export ZEROTRUST_REDIS_PASSWORD=secure_password
```

## Configuration Validation

ZeroTrustKerberosLink includes a configuration validation tool:

```bash
zerotrust-admin validate-config --config /etc/zerotrust/config.yaml
```

Example output:

```
Configuration validation successful!
No errors or warnings found.
```

## Secure Configuration Practices

1. **Use Environment Variables for Secrets**: Avoid storing sensitive values in configuration files
2. **Restrict File Permissions**: Limit access to configuration files
3. **Use Separate Files for Sensitive Configuration**: Keep sensitive configuration separate
4. **Encrypt Sensitive Configuration**: Encrypt files containing sensitive information
5. **Use a Secrets Manager**: Store sensitive values in a secure secrets manager

## Dynamic Configuration

Some configuration options can be changed at runtime without restarting the service:

```bash
zerotrust-admin config set security.rate_limiting.rate 200
```

Dynamically configurable options include:

- Log levels
- Rate limiting settings
- Session expiration times
- Role mapping refresh intervals

## Configuration Templates

ZeroTrustKerberosLink includes configuration templates for common scenarios:

```bash
zerotrust-admin generate-config --template production > config.yaml
```

Available templates:

- `development`: Development environment with debug enabled
- `testing`: Testing environment with minimal security
- `production`: Production environment with full security
- `high-availability`: Configuration for HA deployments
- `minimal`: Minimal configuration for testing

## Configuration Examples

### Basic Configuration

```yaml
server:
  host: 0.0.0.0
  port: 443

authentication:
  kerberos:
    enabled: true
    service_principal: HTTP/zerotrust.example.com@EXAMPLE.COM
    keytab_file: /etc/zerotrust/kerberos/zerotrust.keytab

aws:
  default_region: us-west-2
  credential_duration: 3600

redis:
  host: localhost
  port: 6379
```

### High-Security Configuration

```yaml
server:
  host: 0.0.0.0
  port: 443
  tls:
    enabled: true
    cert_file: /etc/zerotrust/tls/server.crt
    key_file: /etc/zerotrust/tls/server.key
    min_version: TLSv1.3
    ciphers:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256

authentication:
  kerberos:
    enabled: true
    service_principal: HTTP/zerotrust.example.com@EXAMPLE.COM
    keytab_file: /etc/zerotrust/kerberos/zerotrust.keytab
    renewable: true
    forwardable: false
  
  session:
    provider: redis
    expiration: 1800
    renewal_window: 300
    max_lifetime: 43200
    inactivity_timeout: 900

security:
  headers:
    content_security_policy: "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"
    strict_transport_security: "max-age=63072000; includeSubDomains; preload"
    x_content_type_options: "nosniff"
    x_frame_options: "DENY"
    x_xss_protection: "1; mode=block"
    referrer_policy: "strict-origin-when-cross-origin"
    permissions_policy: "geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=()"
  
  rate_limiting:
    enabled: true
    rate: 50
    period: 60
    by_user: true
    by_ip: true
  
  input_validation:
    strict_mode: true
    sanitize_html: true
    prevent_path_traversal: true

redis:
  host: redis.example.com
  port: 6379
  password: ${REDIS_PASSWORD}
  tls:
    enabled: true
    cert_file: /etc/zerotrust/tls/redis-client.crt
    key_file: /etc/zerotrust/tls/redis-client.key
    ca_file: /etc/zerotrust/tls/ca.crt

secrets:
  provider: hashicorp
  config:
    url: https://vault.example.com:8200
    auth_method: approle
    role_id: ${VAULT_ROLE_ID}
    secret_id: ${VAULT_SECRET_ID}
```

### High-Availability Configuration

```yaml
server:
  host: 0.0.0.0
  port: 443
  workers: 8
  max_requests: 5000

authentication:
  kerberos:
    enabled: true
    service_principal: HTTP/zerotrust.example.com@EXAMPLE.COM
    keytab_file: /etc/zerotrust/kerberos/zerotrust.keytab
  
  session:
    provider: redis_cluster

redis:
  cluster:
    enabled: true
    nodes:
      - host: redis-1.example.com
        port: 6379
      - host: redis-2.example.com
        port: 6379
      - host: redis-3.example.com
        port: 6379
    password: ${REDIS_PASSWORD}
    tls:
      enabled: true
      cert_file: /etc/zerotrust/tls/redis-client.crt
      key_file: /etc/zerotrust/tls/redis-client.key
      ca_file: /etc/zerotrust/tls/ca.crt
  pool:
    max_connections: 50
    min_connections: 10

advanced:
  connection_draining_timeout: 60
  graceful_shutdown_timeout: 120
```

## Troubleshooting Configuration Issues

### Common Configuration Problems

1. **Incorrect File Permissions**: Ensure configuration files have correct permissions
2. **Missing Environment Variables**: Check that all required environment variables are set
3. **Invalid YAML Syntax**: Validate YAML syntax with a YAML linter
4. **Incorrect Paths**: Verify that all file paths are correct and accessible

### Configuration Debugging

Enable debug logging to troubleshoot configuration issues:

```yaml
logging:
  level: DEBUG
  output: stdout
```

### Configuration Validation Errors

Example validation errors and solutions:

```
Error: Invalid TLS configuration - cert_file not found
Solution: Ensure the certificate file exists at the specified path

Error: Redis connection failed - connection refused
Solution: Verify Redis host and port are correct

Error: Kerberos authentication failed - cannot find key for HTTP/zerotrust.example.com@EXAMPLE.COM
Solution: Check that the keytab file contains the correct service principal
```

## Next Steps

After configuring ZeroTrustKerberosLink, proceed to:

1. [AWS Integration](aws-integration.md): Configure AWS integration
2. [Role Mapping](../core-concepts/role-mapping.md): Set up role mappings
3. [Security Hardening](../security-hardening/index.md): Implement security hardening
4. [Monitoring](monitoring.md): Configure monitoring and alerting

# Authentication Configuration

ZeroTrustKerberosLink provides flexible authentication configuration options to integrate with your existing Kerberos infrastructure and implement Zero Trust principles.

## Kerberos Authentication

### Basic Configuration

```yaml
authentication:
  kerberos:
    enabled: true
    service_principal: "HTTP/zerotrustkerberos.example.com@EXAMPLE.COM"
    keytab_file: "/etc/zerotrustkerberos/keytab/service.keytab"
    realm: "EXAMPLE.COM"
    kdc: "kdc.example.com"
    admin_server: "kerberos-admin.example.com"
    dns_lookup_kdc: false
    verify_keytab: true
```

### Advanced Configuration

```yaml
authentication:
  kerberos:
    encryption_types:
      - "aes256-cts-hmac-sha1-96"
      - "aes128-cts-hmac-sha1-96"
    ticket_lifetime: "10h"
    renew_lifetime: "7d"
    forwardable: true
    proxiable: false
    renewable: true
    clock_skew: "5m"
    allow_weak_crypto: false
    debug: false
```

## Authentication Policies

ZeroTrustKerberosLink implements Zero Trust principles through configurable authentication policies:

```yaml
authentication:
  policies:
    - name: "default"
      conditions:
        ip_ranges: ["10.0.0.0/8", "172.16.0.0/12"]
        time_window: ["08:00-18:00"]
        days: ["Monday-Friday"]
      require_mfa: false
      session_duration: "8h"
    
    - name: "high_security"
      conditions:
        ip_ranges: ["10.10.0.0/16"]
      require_mfa: true
      session_duration: "1h"
      mfa_validity: "8h"
```

## Multi-Factor Authentication

ZeroTrustKerberosLink supports integration with Multi-Factor Authentication (MFA) providers:

```yaml
authentication:
  mfa:
    enabled: true
    provider: "totp"  # Time-based One-Time Password
    issuer: "ZeroTrustKerberosLink"
    digits: 6
    period: 30
    algorithm: "SHA1"
    window: 1
```

### TOTP Configuration

Time-based One-Time Password (TOTP) configuration for software tokens:

```yaml
authentication:
  mfa:
    totp:
      issuer: "ZeroTrustKerberosLink"
      digits: 6
      period: 30
      algorithm: "SHA1"
      window: 1
```

### Integration with External MFA Providers

```yaml
authentication:
  mfa:
    external:
      provider: "duo"
      integration_key: "${DUO_INTEGRATION_KEY}"
      secret_key: "${DUO_SECRET_KEY}"
      api_hostname: "api-xxxxxxxx.duosecurity.com"
```

## Session Management

Configure how authentication sessions are managed:

```yaml
authentication:
  session:
    store: "redis"
    cookie:
      name: "zerotrustkerberos_session"
      secure: true
      http_only: true
      same_site: "strict"
      max_age: 28800  # 8 hours in seconds
    idle_timeout: "30m"
    absolute_timeout: "8h"
    refresh_threshold: "15m"
```

## Role Mapping

Configure how Kerberos principals are mapped to AWS IAM roles:

```yaml
authentication:
  role_mapping:
    default_role: "arn:aws:iam::123456789012:role/DefaultRole"
    mappings:
      - principal: "admin@EXAMPLE.COM"
        role: "arn:aws:iam::123456789012:role/AdminRole"
        conditions:
          ip_ranges: ["10.0.0.0/8"]
          time_window: ["08:00-18:00"]
      
      - principal: "developer@EXAMPLE.COM"
        role: "arn:aws:iam::123456789012:role/DeveloperRole"
      
      - principal_pattern: "*.service@EXAMPLE.COM"
        role: "arn:aws:iam::123456789012:role/ServiceRole"
```

## Authentication Logging

Configure authentication event logging:

```yaml
authentication:
  logging:
    level: "info"  # debug, info, warn, error
    format: "json"
    events:
      success: true
      failure: true
      mfa: true
      session: true
    include_ip: true
    include_user_agent: true
```

## Security Considerations

When configuring authentication, follow these best practices:

<div class="security-feature">
  <h4>Use Strong Encryption</h4>
  <p>Configure Kerberos to use strong encryption types like AES256-CTS-HMAC-SHA1-96 and disable weak encryption types.</p>
</div>

<div class="security-feature">
  <h4>Protect Keytab Files</h4>
  <p>Secure keytab files with appropriate file permissions (0600) and restrict access to the service account only.</p>
</div>

<div class="security-feature">
  <h4>Implement MFA</h4>
  <p>Enable Multi-Factor Authentication for sensitive operations and high-privilege roles.</p>
</div>

<div class="security-feature">
  <h4>Limit Session Duration</h4>
  <p>Configure appropriate session timeouts based on security requirements and user experience considerations.</p>
</div>

<div class="security-feature">
  <h4>Apply Least Privilege</h4>
  <p>Map users to AWS roles with the minimum permissions necessary for their job functions.</p>
</div>

## Testing Authentication

ZeroTrustKerberosLink provides tools to test authentication configuration:

```bash
# Test Kerberos authentication
zerotrustkerberos auth test-kerberos --principal user@EXAMPLE.COM

# Test role mapping
zerotrustkerberos auth test-role-mapping --principal user@EXAMPLE.COM

# Test MFA configuration
zerotrustkerberos auth test-mfa --provider totp

# Validate keytab file
zerotrustkerberos auth validate-keytab --keytab /etc/zerotrustkerberos/keytab/service.keytab
```

## Troubleshooting

Common authentication issues include:

| Issue | Possible Causes | Resolution |
|-------|-----------------|------------|
| Kerberos authentication failure | Invalid keytab, clock skew | Verify keytab with `klist -k`, synchronize clocks |
| Role mapping failure | Misconfigured mapping, condition not met | Check role mapping configuration, verify conditions |
| MFA failure | Incorrect token, time drift | Verify token, check time synchronization |
| Session expiration | Timeout settings too short | Adjust session timeout settings |

## Related Documentation

- [Security Headers](../security-hardening/security-headers.md)
- [Secure Communications](../security-hardening/secure-communications.md)
- [AWS Integration](../implementation-guide/aws-integration.md)
- [Custom Policies](../implementation-guide/custom-policies.md)

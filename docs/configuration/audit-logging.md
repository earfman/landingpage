# Audit Logging Configuration

ZeroTrustKerberosLink implements comprehensive audit logging to track security-relevant events, support compliance requirements, and provide visibility into system operations.

## Audit Log Configuration

### Basic Configuration

```yaml
audit:
  enabled: true
  level: "info"  # debug, info, warn, error
  format: "json"  # json, text
  output:
    - type: "file"
      path: "/var/log/zerotrustkerberos/audit.log"
    - type: "syslog"
      facility: "local6"
```

### Event Types

Configure which events are logged:

```yaml
audit:
  events:
    authentication:
      success: true
      failure: true
    authorization:
      success: true
      failure: true
    aws:
      role_assumption: true
      credential_issuance: true
    admin:
      configuration_change: true
      user_management: true
    system:
      startup: true
      shutdown: true
      error: true
```

## Log Format

### JSON Format

JSON format provides structured logs that are easy to parse and analyze:

```json
{
  "timestamp": "2025-05-01T12:34:56.789Z",
  "level": "info",
  "event_type": "authentication.success",
  "principal": "user@EXAMPLE.COM",
  "source_ip": "10.0.0.1",
  "user_agent": "Mozilla/5.0...",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "details": {
    "authentication_method": "kerberos",
    "aws_role": "arn:aws:iam::123456789012:role/UserRole",
    "session_id": "session-12345678"
  }
}
```

### Text Format

Text format provides human-readable logs:

```
2025-05-01T12:34:56.789Z [INFO] [authentication.success] [a1b2c3d4-e5f6-7890-abcd-ef1234567890] user@EXAMPLE.COM from 10.0.0.1 authenticated via kerberos, mapped to role arn:aws:iam::123456789012:role/UserRole
```

## Log Destinations

ZeroTrustKerberosLink supports multiple log destinations:

### File Logging

```yaml
audit:
  output:
    - type: "file"
      path: "/var/log/zerotrustkerberos/audit.log"
      rotation:
        enabled: true
        max_size: "100MB"
        max_files: 10
        max_age: "30d"
        compress: true
```

### Syslog

```yaml
audit:
  output:
    - type: "syslog"
      facility: "local6"
      tag: "zerotrustkerberos"
      network: "udp"
      address: "localhost:514"
```

### AWS CloudWatch Logs

```yaml
audit:
  output:
    - type: "cloudwatch"
      group: "/zerotrustkerberos/audit"
      stream: "{hostname}"
      region: "us-west-2"
      create_group: true
      retention_days: 90
```

### Elasticsearch

```yaml
audit:
  output:
    - type: "elasticsearch"
      url: "https://elasticsearch.example.com:9200"
      index: "zerotrustkerberos-audit"
      username_env: "ES_USERNAME"
      password_env: "ES_PASSWORD"
      tls:
        enabled: true
        ca_file: "/etc/zerotrustkerberos/certs/es-ca.pem"
```

## Sensitive Data Handling

Configure how sensitive data is handled in audit logs:

```yaml
audit:
  sensitive_data:
    mask_credentials: true
    mask_pattern: "****"
    include_ip: true
    include_user_agent: true
    include_headers:
      - "X-Forwarded-For"
      - "X-Real-IP"
```

## High Availability Considerations

For high availability deployments:

```yaml
audit:
  buffer:
    enabled: true
    size: 1000
    flush_interval: "5s"
  retry:
    enabled: true
    max_retries: 3
    backoff: "exponential"
  failover:
    enabled: true
    destinations:
      - type: "file"
        path: "/var/log/zerotrustkerberos/audit-failover.log"
```

## Compliance Requirements

ZeroTrustKerberosLink's audit logging helps meet various compliance requirements:

<div class="compliance-section">
  <h4>SOC 2</h4>
  <p>Audit logs track user authentication, authorization, and administrative actions to support SOC 2 requirements for security monitoring and access control.</p>
</div>

<div class="compliance-section">
  <h4>PCI DSS</h4>
  <p>Audit logs track access to cardholder data environments and authentication events to support PCI DSS requirements for access tracking and monitoring.</p>
</div>

<div class="compliance-section">
  <h4>HIPAA</h4>
  <p>Audit logs track access to protected health information (PHI) to support HIPAA requirements for access monitoring and audit controls.</p>
</div>

<div class="compliance-section">
  <h4>GDPR</h4>
  <p>Audit logs track processing of personal data to support GDPR requirements for accountability and security of processing.</p>
</div>

## Security Considerations

When configuring audit logging, follow these best practices:

<div class="security-feature">
  <h4>Log to Multiple Destinations</h4>
  <p>Configure multiple log destinations to ensure audit logs are preserved even if one destination fails.</p>
</div>

<div class="security-feature">
  <h4>Protect Audit Logs</h4>
  <p>Implement appropriate access controls and encryption for audit logs to prevent tampering.</p>
</div>

<div class="security-feature">
  <h4>Set Appropriate Retention</h4>
  <p>Configure log retention based on compliance requirements and operational needs.</p>
</div>

<div class="security-feature">
  <h4>Mask Sensitive Data</h4>
  <p>Configure masking for sensitive data to prevent exposure in audit logs.</p>
</div>

<div class="security-feature">
  <h4>Monitor Log Delivery</h4>
  <p>Implement monitoring for log delivery to detect and address log delivery failures.</p>
</div>

## Log Analysis

ZeroTrustKerberosLink provides tools for analyzing audit logs:

```bash
# Search audit logs for specific events
zerotrustkerberos audit search --event-type authentication.failure --principal user@EXAMPLE.COM

# Generate audit report
zerotrustkerberos audit report --start-time "2025-05-01T00:00:00Z" --end-time "2025-05-02T00:00:00Z" --output audit-report.pdf

# Validate audit log integrity
zerotrustkerberos audit validate --log-file /var/log/zerotrustkerberos/audit.log
```

## Related Documentation

- [Compliance Verification](../implementation-guide/compliance-verification.md)
- [Monitoring](../implementation-guide/monitoring.md)
- [Security Hardening](../security-hardening/index.md)
- [High Availability](../implementation-guide/high-availability.md)

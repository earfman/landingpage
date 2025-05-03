# Audit Logging

This guide explains how to implement comprehensive audit logging in ZeroTrustKerberosLink to support security monitoring, compliance requirements, and incident response.

## Overview

Audit logging captures detailed records of authentication events, access decisions, and administrative actions. Proper audit logging is essential for:

- Security monitoring and threat detection
- Compliance with regulatory requirements
- Forensic analysis during incident response
- Troubleshooting authentication issues

## Log Types

ZeroTrustKerberosLink generates several types of audit logs:

### Authentication Logs

Records all authentication attempts:

```json
{
  "timestamp": "2025-05-01T10:15:23.456Z",
  "event_type": "authentication",
  "status": "success",
  "principal": "user@EXAMPLE.COM",
  "client_ip": "10.1.2.3",
  "user_agent": "curl/7.68.0",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Authorization Logs

Records access control decisions:

```json
{
  "timestamp": "2025-05-01T10:15:24.123Z",
  "event_type": "authorization",
  "status": "granted",
  "principal": "user@EXAMPLE.COM",
  "aws_role": "arn:aws:iam::123456789012:role/DeveloperRole",
  "policy_name": "Developer Access",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Administrative Logs

Records administrative actions:

```json
{
  "timestamp": "2025-05-01T09:30:15.789Z",
  "event_type": "admin",
  "action": "config_update",
  "admin_user": "admin@EXAMPLE.COM",
  "client_ip": "10.1.2.3",
  "details": "Updated role mappings"
}
```

### System Logs

Records system events:

```json
{
  "timestamp": "2025-05-01T08:00:01.234Z",
  "event_type": "system",
  "component": "redis_cache",
  "status": "connected",
  "details": "Successfully connected to Redis cache"
}
```

## Log Configuration

### Basic Configuration

Configure logging in `config.yaml`:

```yaml
logging:
  level: "info"
  format: "json"
  output: "file"
  file_path: "/var/log/zerotrustkerberos/audit.log"
  
  # What to include in logs
  include:
    request_id: true
    client_ip: true
    user_agent: true
    timestamp: true
```

### Advanced Configuration

For more detailed logging:

```yaml
logging:
  level: "debug"
  format: "json"
  
  # Multiple outputs
  outputs:
    - type: "file"
      path: "/var/log/zerotrustkerberos/audit.log"
      rotation:
        max_size_mb: 100
        max_files: 10
    
    - type: "syslog"
      facility: "local0"
      
    - type: "stdout"
  
  # Detailed event configuration
  events:
    authentication:
      level: "info"
      include_context: true
    
    authorization:
      level: "info"
      include_policy_details: true
    
    admin:
      level: "info"
      include_details: true
    
    system:
      level: "info"
```

### Log Redaction

Configure sensitive data redaction:

```yaml
logging:
  redaction:
    enabled: true
    fields:
      - name: "password"
        action: "remove"
      - name: "token"
        action: "hash"
      - name: "ip"
        action: "partial"
        keep_chars: 2
```

## Log Destinations

### File Logging

Basic file logging:

```yaml
logging:
  output: "file"
  file_path: "/var/log/zerotrustkerberos/audit.log"
  rotation:
    max_size_mb: 100
    max_files: 10
    compress: true
```

### Syslog

Send logs to syslog:

```yaml
logging:
  output: "syslog"
  syslog:
    facility: "local0"
    tag: "zerotrustkerberos"
    server: "syslog.example.com"  # Optional, uses local syslog if not specified
    port: 514                     # Optional
    protocol: "udp"               # "udp" or "tcp"
```

### AWS CloudWatch

Send logs to AWS CloudWatch:

```yaml
logging:
  output: "cloudwatch"
  cloudwatch:
    log_group: "/zerotrustkerberos/audit"
    log_stream_prefix: "instance-"
    region: "us-west-2"
    batch_size: 100
    batch_interval_seconds: 5
```

### Elasticsearch

Send logs to Elasticsearch:

```yaml
logging:
  output: "elasticsearch"
  elasticsearch:
    hosts:
      - "https://elasticsearch.example.com:9200"
    index_prefix: "zerotrustkerberos-"
    username: "elastic"
    password_file: "/etc/zerotrustkerberos/secrets/es_password"
    tls:
      ca_cert: "/etc/zerotrustkerberos/certs/es_ca.crt"
```

## Compliance Requirements

Configure logging to meet specific compliance requirements:

### PCI DSS

```yaml
logging:
  compliance:
    pci_dss:
      enabled: true
      # Ensures these fields are always logged
      required_fields:
        - "timestamp"
        - "principal"
        - "client_ip"
        - "event_type"
        - "status"
      retention_days: 365
```

### SOC 2

```yaml
logging:
  compliance:
    soc2:
      enabled: true
      required_fields:
        - "timestamp"
        - "principal"
        - "client_ip"
        - "event_type"
        - "status"
        - "request_id"
      retention_days: 365
```

### HIPAA

```yaml
logging:
  compliance:
    hipaa:
      enabled: true
      required_fields:
        - "timestamp"
        - "principal"
        - "event_type"
        - "status"
      redact_ip: true
      encryption:
        enabled: true
        key_file: "/etc/zerotrustkerberos/secrets/log_encryption_key"
```

## Log Rotation

Configure log rotation to manage log files:

```yaml
logging:
  rotation:
    max_size_mb: 100
    max_files: 10
    compress: true
    compression_method: "gzip"  # "gzip", "zip", or "bzip2"
    rotate_on_start: false
```

For systems using logrotate:

```
# /etc/logrotate.d/zerotrustkerberos
/var/log/zerotrustkerberos/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 zerotrustkerberos zerotrustkerberos
    sharedscripts
    postrotate
        systemctl kill -s USR1 zerotrustkerberos.service
    endscript
}
```

## Log Analysis

### Log Search

Use jq to search JSON logs:

```bash
# Find failed authentication attempts
cat /var/log/zerotrustkerberos/audit.log | jq 'select(.event_type == "authentication" and .status == "failed")'

# Find access from specific IP
cat /var/log/zerotrustkerberos/audit.log | jq 'select(.client_ip == "10.1.2.3")'

# Count events by type
cat /var/log/zerotrustkerberos/audit.log | jq -r '.event_type' | sort | uniq -c
```

### Log Aggregation

Configure log aggregation with tools like:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Graylog**
- **AWS CloudWatch Logs**

Example Logstash configuration:

```
input {
  file {
    path => "/var/log/zerotrustkerberos/audit.log"
    codec => "json"
    type => "zerotrustkerberos"
  }
}

filter {
  if [type] == "zerotrustkerberos" {
    date {
      match => [ "timestamp", "ISO8601" ]
      target => "@timestamp"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "zerotrustkerberos-%{+YYYY.MM.dd}"
  }
}
```

## Security Monitoring

### Alert Rules

Example alert rules for security monitoring:

| Alert | Description | Threshold |
|-------|-------------|-----------|
| Authentication Failures | Multiple failed authentication attempts | 5 failures in 5 minutes |
| Off-hours Access | Access outside business hours | Any access between 8PM-6AM |
| Unusual IP | Access from unusual IP address | Any access from outside allowed ranges |
| Admin Actions | Administrative actions | All admin actions |
| Role Escalation | User accessing higher privilege role | Any role escalation |

### SIEM Integration

Configure Security Information and Event Management (SIEM) integration:

```yaml
logging:
  siem:
    enabled: true
    type: "splunk"  # "splunk", "qradar", "arcsight"
    endpoint: "https://splunk.example.com:8088"
    token_file: "/etc/zerotrustkerberos/secrets/splunk_token"
    source_type: "zerotrustkerberos"
    index: "security"
```

## Best Practices

### Logging Best Practices

1. **Consistent Timestamps**: Use UTC for all timestamps
2. **Structured Logging**: Use JSON format for machine-readable logs
3. **Unique Identifiers**: Include request IDs to correlate related events
4. **Contextual Information**: Include relevant context with each log
5. **Sensitive Data Handling**: Redact or hash sensitive information
6. **Log Integrity**: Ensure logs cannot be tampered with
7. **Log Retention**: Define and enforce retention policies

### Security Best Practices

1. **Log Protection**: Secure log files with appropriate permissions
2. **Centralized Logging**: Send logs to a central, secure location
3. **Log Encryption**: Encrypt logs at rest and in transit
4. **Access Control**: Restrict access to logs to authorized personnel
5. **Monitoring**: Actively monitor logs for security events
6. **Backup**: Regularly back up log data
7. **Testing**: Regularly test logging functionality

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Missing logs | Incorrect log level | Check log level configuration |
| Log permission errors | File permission issues | Check file permissions |
| Log rotation failures | Incorrect rotation settings | Verify rotation configuration |
| High disk usage | Insufficient rotation | Adjust rotation settings |
| Performance impact | Excessive logging | Optimize log levels and fields |

### Debugging Logging

Enable debug logging temporarily:

```bash
# Set environment variable for debug logging
export ZEROTRUST_LOG_LEVEL=debug

# Restart service
systemctl restart zerotrustkerberos
```

## Related Documentation

- [Implementation Guide](./index.md)
- [Security Hardening](../security-hardening/index.md)
- [Compliance](../security-hardening/compliance.md)
- [Monitoring](./monitoring.md)

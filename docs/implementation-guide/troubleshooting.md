# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with ZeroTrustKerberosLink. Each section focuses on a specific area where problems might occur.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [AWS Integration Issues](#aws-integration-issues)
3. [Configuration Issues](#configuration-issues)
4. [Performance Issues](#performance-issues)
5. [Security Issues](#security-issues)
6. [Logging and Monitoring Issues](#logging-and-monitoring-issues)
7. [Deployment Issues](#deployment-issues)

## Authentication Issues

### Kerberos Authentication Failures

**Symptoms:**
- Error message: "Kerberos authentication failed"
- HTTP 401 Unauthorized responses
- Client unable to obtain service tickets

**Common Causes and Solutions:**

1. **Invalid Keytab File**
   - Verify keytab file exists and has correct permissions:
     ```bash
     ls -la /etc/zerotrustkerberos/krb5.keytab
     # Should show: -r-------- 1 zerotrustkerberos zerotrustkerberos
     ```
   - Check keytab content:
     ```bash
     klist -kt /etc/zerotrustkerberos/krb5.keytab
     ```

2. **Clock Skew**
   - Verify time synchronization:
     ```bash
     chronyc tracking
     # or
     ntpq -p
     ```
   - Ensure time difference is less than 5 minutes between client, KDC, and ZeroTrustKerberosLink

3. **Incorrect Service Principal**
   - Confirm service principal in configuration matches keytab:
     ```bash
     grep service_principal /etc/zerotrustkerberos/config.yaml
     klist -kt /etc/zerotrustkerberos/krb5.keytab | grep HTTP
     ```

4. **Network Connectivity Issues**
   - Test connectivity to Kerberos KDC:
     ```bash
     telnet kdc.example.com 88
     ```

### User Authentication Failures

**Symptoms:**
- Users can't authenticate despite valid Kerberos tickets
- Error message: "User not authorized"

**Common Causes and Solutions:**

1. **Missing Role Mapping**
   - Check role mappings in configuration:
     ```bash
     grep -A 20 role_mappings /etc/zerotrustkerberos/config.yaml
     ```
   - Add appropriate mapping for user principal

2. **Principal Format Mismatch**
   - Ensure principal format matches exactly:
     ```
     # Configuration: admin@EXAMPLE.COM
     # User ticket: Admin@EXAMPLE.COM (case mismatch)
     ```

3. **Context Evaluation Failure**
   - Check context evaluation logs:
     ```bash
     grep "context evaluation" /var/log/zerotrustkerberos/app.log
     ```
   - Verify user meets all context requirements (IP, time, etc.)

## AWS Integration Issues

### Role Assumption Failures

**Symptoms:**
- Error message: "Failed to assume role"
- HTTP 403 Forbidden responses

**Common Causes and Solutions:**

1. **Invalid IAM Role ARN**
   - Verify role exists:
     ```bash
     aws iam get-role --role-name AdminRole
     ```
   - Check role ARN format in configuration

2. **Trust Relationship Issues**
   - Examine trust policy:
     ```bash
     aws iam get-role --role-name AdminRole --query 'Role.AssumeRolePolicyDocument'
     ```
   - Update trust policy to allow ZeroTrustKerberosLink to assume the role

3. **Permission Issues**
   - Verify ZeroTrustKerberosLink has sts:AssumeRole permission:
     ```bash
     aws iam simulate-principal-policy \
       --policy-source-arn arn:aws:iam::123456789012:role/ZeroTrustKerberosLinkRole \
       --action-names sts:AssumeRole
     ```

### AWS Credential Issues

**Symptoms:**
- Error message: "Unable to retrieve AWS credentials"
- AWS API calls fail after authentication

**Common Causes and Solutions:**

1. **AWS Region Configuration**
   - Verify AWS region in configuration:
     ```bash
     grep region /etc/zerotrustkerberos/config.yaml
     ```
   - Ensure region is valid and accessible

2. **AWS API Throttling**
   - Check for throttling errors in logs:
     ```bash
     grep "throttling" /var/log/zerotrustkerberos/app.log
     ```
   - Implement exponential backoff for API calls

3. **Temporary Credential Expiration**
   - Verify session duration settings:
     ```bash
     grep -A 5 session /etc/zerotrustkerberos/config.yaml
     ```
   - Adjust session duration as needed (max 12 hours)

## Configuration Issues

### Syntax Errors

**Symptoms:**
- Application fails to start
- Error message: "Invalid configuration"

**Common Causes and Solutions:**

1. **YAML Syntax Errors**
   - Validate YAML syntax:
     ```bash
     yamllint /etc/zerotrustkerberos/config.yaml
     ```
   - Fix indentation and formatting issues

2. **Missing Required Fields**
   - Check for all required configuration fields:
     ```bash
     zerotrustkerberos-cli validate-config --config /etc/zerotrustkerberos/config.yaml
     ```
   - Add missing required fields

3. **Invalid Values**
   - Verify all configuration values are valid:
     ```bash
     zerotrustkerberos-cli validate-config --strict --config /etc/zerotrustkerberos/config.yaml
     ```
   - Correct any invalid values

### Environment Variable Issues

**Symptoms:**
- Configuration doesn't match expected values
- Overrides not taking effect

**Common Causes and Solutions:**

1. **Case Sensitivity**
   - Environment variables are case-sensitive:
     ```bash
     # Correct: ZEROTRUST_SERVER_PORT=8443
     # Incorrect: zerotrust_server_port=8443
     ```

2. **Variable Format**
   - Check variable format:
     ```bash
     # Correct: ZEROTRUST_REDIS_HOST=redis.example.com
     # Incorrect: ZEROTRUST_REDIS.HOST=redis.example.com
     ```

3. **Variable Precedence**
   - Understand precedence order:
     1. Command-line arguments
     2. Environment variables
     3. Configuration file
     4. Default values

## Performance Issues

### High Latency

**Symptoms:**
- Authentication takes more than 1 second
- AWS role assumption is slow

**Common Causes and Solutions:**

1. **Insufficient Resources**
   - Check CPU and memory usage:
     ```bash
     top -p $(pgrep -f zerotrustkerberos)
     ```
   - Increase allocated resources

2. **Network Latency**
   - Test network latency to AWS and KDC:
     ```bash
     ping kdc.example.com
     ping sts.amazonaws.com
     ```
   - Consider deploying closer to AWS region

3. **Inefficient Caching**
   - Enable or optimize Redis caching:
     ```yaml
     cache:
       enabled: true
       ttl: 300  # seconds
     ```

### Connection Pooling Issues

**Symptoms:**
- Increasing latency under load
- Connection-related errors

**Common Causes and Solutions:**

1. **Insufficient Connection Pool Size**
   - Increase connection pool size:
     ```yaml
     aws:
       connection_pool_size: 20
     ```

2. **Connection Leaks**
   - Check for connection leaks in logs:
     ```bash
     grep "connection" /var/log/zerotrustkerberos/app.log
     ```
   - Implement proper connection closing

3. **Connection Timeouts**
   - Adjust timeout settings:
     ```yaml
     aws:
       timeout: 5  # seconds
     ```

## Security Issues

### TLS Configuration Issues

**Symptoms:**
- TLS handshake failures
- Certificate validation errors

**Common Causes and Solutions:**

1. **Invalid Certificate**
   - Verify certificate validity:
     ```bash
     openssl x509 -in /etc/zerotrustkerberos/tls/certificate.crt -text -noout
     ```
   - Ensure certificate is not expired

2. **Cipher Suite Compatibility**
   - Check cipher suite configuration:
     ```bash
     grep -A 5 tls /etc/zerotrustkerberos/config.yaml
     ```
   - Update cipher suites for better compatibility

3. **TLS Version Issues**
   - Verify minimum TLS version:
     ```yaml
     server:
       tls:
         min_version: "TLSv1.2"
     ```
   - Update clients to support required TLS version

### Security Header Issues

**Symptoms:**
- Security scanners report missing headers
- Browser security warnings

**Common Causes and Solutions:**

1. **Missing Headers**
   - Check header configuration:
     ```bash
     grep -A 10 headers /etc/zerotrustkerberos/config.yaml
     ```
   - Add missing security headers

2. **Invalid Header Values**
   - Verify header values:
     ```bash
     curl -I https://zerotrustkerberos.example.com/auth/test
     ```
   - Correct invalid header values

3. **CSP Configuration**
   - Test Content Security Policy:
     ```bash
     curl -I https://zerotrustkerberos.example.com/auth/test | grep Content-Security-Policy
     ```
   - Adjust CSP for required functionality

## Logging and Monitoring Issues

### Missing Logs

**Symptoms:**
- Events not appearing in logs
- Incomplete audit trail

**Common Causes and Solutions:**

1. **Log Level Too High**
   - Check log level configuration:
     ```bash
     grep level /etc/zerotrustkerberos/config.yaml
     ```
   - Set appropriate log level (debug, info, warn, error)

2. **Log Destination Issues**
   - Verify log destination:
     ```bash
     grep output /etc/zerotrustkerberos/config.yaml
     ```
   - Ensure log destination is writable

3. **Log Rotation Issues**
   - Check log rotation configuration:
     ```bash
     cat /etc/logrotate.d/zerotrustkerberos
     ```
   - Configure proper log rotation

### Monitoring Integration Issues

**Symptoms:**
- Metrics not appearing in monitoring system
- Alerts not triggering

**Common Causes and Solutions:**

1. **Prometheus Endpoint Issues**
   - Verify Prometheus endpoint:
     ```bash
     curl http://localhost:8080/metrics
     ```
   - Check Prometheus scrape configuration

2. **Metric Format Issues**
   - Validate metric format:
     ```bash
     curl http://localhost:8080/metrics | grep auth_requests
     ```
   - Correct any metric format issues

3. **Alert Configuration Issues**
   - Review alert configuration:
     ```bash
     grep -A 10 alerts /etc/zerotrustkerberos/config.yaml
     ```
   - Adjust alert thresholds and conditions

## Deployment Issues

### Docker Deployment Issues

**Symptoms:**
- Container fails to start
- Container exits unexpectedly

**Common Causes and Solutions:**

1. **Volume Mount Issues**
   - Check volume mounts:
     ```bash
     docker inspect zerotrustkerberos | grep -A 10 Mounts
     ```
   - Correct volume mount paths and permissions

2. **Environment Variable Issues**
   - Verify environment variables:
     ```bash
     docker inspect zerotrustkerberos | grep -A 20 Env
     ```
   - Set missing or correct invalid environment variables

3. **Container Resource Limits**
   - Check resource limits:
     ```bash
     docker stats zerotrustkerberos
     ```
   - Adjust CPU and memory limits as needed

### Kubernetes Deployment Issues

**Symptoms:**
- Pods fail to start
- Pods crash loop

**Common Causes and Solutions:**

1. **ConfigMap Issues**
   - Verify ConfigMap:
     ```bash
     kubectl describe configmap zerotrustkerberos-config -n zerotrustkerberos
     ```
   - Update ConfigMap with correct configuration

2. **Secret Issues**
   - Check Secret:
     ```bash
     kubectl describe secret zerotrustkerberos-secrets -n zerotrustkerberos
     ```
   - Ensure Secret contains required data

3. **Resource Constraints**
   - Examine pod resources:
     ```bash
     kubectl describe pod -l app=zerotrustkerberos -n zerotrustkerberos
     ```
   - Adjust resource requests and limits

## Diagnostic Tools

ZeroTrustKerberosLink includes several built-in diagnostic tools:

### Health Check

```bash
curl http://localhost:8080/health
```

The health check returns detailed information about:
- Service status
- Component health
- Resource utilization
- Recent errors

### Configuration Validator

```bash
zerotrustkerberos-cli validate-config --config /etc/zerotrustkerberos/config.yaml
```

The validator checks:
- Configuration syntax
- Required fields
- Value constraints
- Security best practices

### Connectivity Tester

```bash
zerotrustkerberos-cli test-connectivity
```

Tests connectivity to:
- Kerberos KDC
- AWS services
- Redis cache
- Monitoring endpoints

## Getting Help

If you're unable to resolve an issue using this guide:

1. **Check Documentation**
   - Review the [Implementation Guide](./index.md)
   - Check the [FAQ](../faq/index.md)

2. **Search Known Issues**
   - Visit the [GitHub Issues](https://github.com/zerotrustkerberos/kerberos-aws-proxy/issues)
   - Search for similar problems

3. **Contact Support**
   - Email: support@zerotrustkerberos.com
   - Include:
     - Detailed description of the issue
     - Configuration files (with sensitive data removed)
     - Relevant log excerpts
     - Steps to reproduce the issue

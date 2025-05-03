# Authentication Flow

This document explains the authentication flow in ZeroTrustKerberosLink, detailing how Kerberos authentication is integrated with AWS services using Zero Trust principles.

## Overview

ZeroTrustKerberosLink implements a secure authentication flow that bridges enterprise Kerberos authentication with AWS services. This flow ensures that only properly authenticated users with appropriate context can access AWS resources, following Zero Trust principles throughout the process.

## Authentication Flow Diagram

The following diagram illustrates the complete authentication flow:

```
┌──────────────┐      ┌───────────────────┐      ┌───────────────┐      ┌────────────┐
│              │      │                   │      │               │      │            │
│     User     │─────▶│ Kerberos KDC      │─────▶│ ZeroTrust     │─────▶│ AWS STS    │
│              │      │                   │      │ KerberosLink  │      │            │
└──────────────┘      └───────────────────┘      └───────────────┘      └────────────┘
       │                       │                        │                     │
       │                       │                        │                     │
       │ 1. Authentication     │                        │                     │
       │    Request            │                        │                     │
       │───────────────────────▶                        │                     │
       │                       │                        │                     │
       │ 2. Kerberos Ticket    │                        │                     │
       │◀───────────────────────                        │                     │
       │                       │                        │                     │
       │ 3. Present Ticket     │                        │                     │
       │────────────────────────────────────────────────▶                     │
       │                       │                        │                     │
       │                       │                        │ 4. Verify Ticket    │
       │                       │◀───────────────────────│                     │
       │                       │                        │                     │
       │                       │ 5. Ticket Valid        │                     │
       │                       │───────────────────────▶│                     │
       │                       │                        │                     │
       │                       │                        │ 6. Context          │
       │                       │                        │    Evaluation       │
       │                       │                        │─────────┐           │
       │                       │                        │◀────────┘           │
       │                       │                        │                     │
       │                       │                        │ 7. AssumeRole       │
       │                       │                        │─────────────────────▶
       │                       │                        │                     │
       │                       │                        │ 8. Temp Credentials │
       │                       │                        │◀─────────────────────
       │                       │                        │                     │
       │ 9. AWS Credentials    │                        │                     │
       │◀───────────────────────────────────────────────│                     │
       │                       │                        │                     │
       │ 10. Access AWS        │                        │                     │
       │     Services          │                        │                     │
       ▼                       │                        │                     │
┌──────────────┐              │                        │                     │
│              │              │                        │                     │
│ AWS Services │              │                        │                     │
│              │              │                        │                     │
└──────────────┘              │                        │                     │
```

## Detailed Authentication Steps

### 1. Initial Authentication Request

The user initiates authentication to their Kerberos realm:

```bash
# User obtains a Kerberos ticket
kinit username@REALM.COM
```

During this step:
- User provides credentials to the Kerberos Key Distribution Center (KDC)
- KDC validates the credentials against the authentication database
- If valid, the authentication process continues

### 2. Kerberos Ticket Issuance

The Kerberos KDC issues a Ticket Granting Ticket (TGT) and service tickets:

- TGT allows the user to request additional service tickets without re-authenticating
- Service ticket for ZeroTrustKerberosLink is issued
- Tickets are encrypted and time-limited

### 3. Ticket Presentation

The user presents the Kerberos service ticket to ZeroTrustKerberosLink:

```bash
# Example HTTP request with Kerberos authentication
curl --negotiate -u : https://zerotrustkerberos.example.com/auth/aws
```

The client application handles the Kerberos authentication protocol, including:
- SPNEGO (Simple and Protected GSSAPI Negotiation Mechanism) negotiation
- Ticket presentation through HTTP headers

### 4. Ticket Verification

ZeroTrustKerberosLink verifies the Kerberos ticket:

```python
# Pseudocode for ticket verification
def verify_kerberos_ticket(ticket):
    # Decrypt ticket using service key
    decrypted_ticket = decrypt(ticket, service_key)
    
    # Verify ticket is not expired
    if decrypted_ticket.expiration < current_time:
        return False
    
    # Verify ticket is for the correct service
    if decrypted_ticket.service_principal != our_service_principal:
        return False
    
    # Additional validation checks
    if not validate_encryption_type(decrypted_ticket):
        return False
    
    return True
```

This verification includes:
- Cryptographic validation of the ticket
- Checking ticket expiration
- Verifying the service principal
- Validating encryption types

### 5. Principal Extraction

After successful ticket verification, ZeroTrustKerberosLink extracts the Kerberos principal:

```python
# Pseudocode for principal extraction
def extract_principal(verified_ticket):
    principal = verified_ticket.client_principal
    return principal  # e.g., "username@REALM.COM"
```

The principal identifies the authenticated user and will be used for AWS role mapping.

### 6. Context Evaluation

Following Zero Trust principles, ZeroTrustKerberosLink evaluates additional context factors:

```python
# Pseudocode for context evaluation
def evaluate_context(request, principal):
    context = {
        "principal": principal,
        "client_ip": request.remote_addr,
        "user_agent": request.headers.get("User-Agent"),
        "request_time": current_time(),
        "device_info": extract_device_info(request),
        "location": geolocate_ip(request.remote_addr)
    }
    
    risk_score = calculate_risk_score(context)
    return context, risk_score
```

Context factors may include:
- Client IP address
- Device information
- Time of request
- User behavior patterns
- Geographic location
- Previous authentication history

### 7. Policy Evaluation

ZeroTrustKerberosLink evaluates policies to determine AWS role mapping:

```python
# Pseudocode for policy evaluation
def evaluate_policies(principal, context, risk_score):
    # Find applicable policies
    policies = find_policies_for_principal(principal)
    
    # Evaluate each policy
    for policy in policies:
        if policy.evaluate(principal, context, risk_score):
            return policy.aws_role
    
    # No policy matched
    return None
```

Policies define:
- Which AWS role to map to each Kerberos principal
- Additional conditions based on context
- Risk thresholds for access

### 8. AWS Role Assumption

ZeroTrustKerberosLink assumes the appropriate AWS IAM role:

```python
# Pseudocode for AWS role assumption
def assume_aws_role(aws_role_arn, principal, context):
    # Create session name from principal
    session_name = principal.replace("@", "-").replace(".", "-")
    
    # Assume role with AWS STS
    response = sts_client.assume_role(
        RoleArn=aws_role_arn,
        RoleSessionName=session_name,
        DurationSeconds=3600  # 1 hour
    )
    
    return response.credentials
```

This step:
- Uses AWS Security Token Service (STS)
- Creates temporary credentials
- Sets appropriate session duration
- May include additional context in session tags

### 9. Credential Delivery

ZeroTrustKerberosLink delivers the temporary AWS credentials to the user:

```json
// Example credential response
{
  "AccessKeyId": "ASIA1234567890EXAMPLE",
  "SecretAccessKey": "secretkey1234567890example",
  "SessionToken": "sessiontoken1234567890example",
  "Expiration": "2025-05-01T06:30:00Z"
}
```

The credentials include:
- Access key ID
- Secret access key
- Session token
- Expiration time

### 10. AWS Service Access

The user uses the temporary credentials to access AWS services:

```bash
# Example AWS CLI usage with temporary credentials
export AWS_ACCESS_KEY_ID=ASIA1234567890EXAMPLE
export AWS_SECRET_ACCESS_KEY=secretkey1234567890example
export AWS_SESSION_TOKEN=sessiontoken1234567890example

aws s3 ls
```

## Security Controls Throughout the Flow

ZeroTrustKerberosLink implements security controls at each step of the authentication flow:

### Input Validation

All inputs are validated to prevent injection attacks:

```yaml
# Configuration for input validation
security:
  input_validation:
    enabled: true
    validate_kerberos_principal: true
    validate_aws_role_arn: true
    validate_client_context: true
```

### Rate Limiting

Rate limiting prevents brute force and denial of service attacks:

```yaml
# Configuration for rate limiting
security:
  rate_limiting:
    enabled: true
    requests_per_minute: 30
    burst: 10
    by_principal: true
    by_ip_address: true
```

### Audit Logging

Comprehensive audit logging records all authentication events:

```yaml
# Configuration for audit logging
audit:
  enabled: true
  log_level: "info"
  include_context: true
  log_format: "json"
  destination: "file"  # or "syslog", "cloudwatch", etc.
```

### Session Monitoring

Active sessions are monitored for suspicious activity:

```yaml
# Configuration for session monitoring
security:
  session_monitoring:
    enabled: true
    track_active_sessions: true
    max_sessions_per_principal: 5
    alert_on_suspicious: true
```

## Error Handling

ZeroTrustKerberosLink handles various error conditions securely:

### Authentication Failures

```python
# Pseudocode for authentication failure handling
def handle_auth_failure(reason, request):
    # Log the failure
    log.warning(f"Authentication failed: {reason}", 
                extra={"ip": request.remote_addr, "attempt_time": current_time()})
    
    # Increment failure counter
    increment_failure_counter(request.remote_addr)
    
    # Check for brute force attempts
    if is_potential_brute_force(request.remote_addr):
        trigger_brute_force_protection(request.remote_addr)
    
    # Return generic error to prevent information disclosure
    return {"error": "Authentication failed"}, 401
```

### Role Mapping Failures

```python
# Pseudocode for role mapping failure handling
def handle_role_mapping_failure(principal, request):
    # Log the failure
    log.warning(f"Role mapping failed for principal: {principal}", 
                extra={"principal": principal, "ip": request.remote_addr})
    
    # Return appropriate error
    return {"error": "No matching AWS role found"}, 403
```

### AWS API Failures

```python
# Pseudocode for AWS API failure handling
def handle_aws_api_failure(error, principal):
    # Log the failure
    log.error(f"AWS API failure: {error}", 
              extra={"principal": principal, "aws_error": str(error)})
    
    # Return appropriate error
    return {"error": "Failed to obtain AWS credentials"}, 500
```

## Configuration Examples

### Basic Configuration

```yaml
# Basic authentication flow configuration
authentication:
  kerberos:
    service_principal: "HTTP/zerotrustkerberos.example.com@EXAMPLE.COM"
    keytab_path: "/etc/zerotrustkerberos/krb5.keytab"
  
  aws:
    region: "us-west-2"
    role_mappings:
      - kerberos_principal: "admin@EXAMPLE.COM"
        aws_role: "arn:aws:iam::123456789012:role/AdminRole"
      - kerberos_principal: "developer@EXAMPLE.COM"
        aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"
```

### Advanced Configuration with Zero Trust Features

```yaml
# Advanced authentication flow configuration
authentication:
  kerberos:
    service_principal: "HTTP/zerotrustkerberos.example.com@EXAMPLE.COM"
    keytab_path: "/etc/zerotrustkerberos/krb5.keytab"
    allowed_encryption_types: ["aes256-cts-hmac-sha1-96"]
  
  context:
    evaluate_ip: true
    evaluate_time: true
    evaluate_device: true
    evaluate_location: true
    risk_scoring: true
  
  aws:
    region: "us-west-2"
    role_mappings:
      - kerberos_principal: "admin@EXAMPLE.COM"
        aws_role: "arn:aws:iam::123456789012:role/AdminRole"
        conditions:
          ip_ranges: ["10.0.0.0/8"]
          time_window: ["08:00-18:00"]
          days: ["Monday-Friday"]
          max_risk_score: 25
      - kerberos_principal: "developer@EXAMPLE.COM"
        aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"
        conditions:
          ip_ranges: ["10.0.0.0/8"]
          require_mfa: true
  
  session:
    default_duration: 3600  # 1 hour
    max_duration: 14400  # 4 hours
    renewal_enabled: true
```

## Troubleshooting

Common authentication flow issues and their solutions:

| Issue | Possible Causes | Solution |
|-------|----------------|----------|
| Kerberos authentication failure | Invalid keytab, expired ticket, clock skew | Check keytab permissions, renew ticket, synchronize clocks |
| No matching AWS role | Misconfigured role mappings, principal format mismatch | Verify role mapping configuration, check principal format |
| AWS role assumption failure | IAM permission issues, invalid trust relationship | Check IAM role trust policy, verify AWS permissions |
| Context evaluation failure | Missing context information, configuration issues | Check context evaluation configuration, verify required context |

## Related Documentation

- [Kerberos Fundamentals](./kerberos.md)
- [AWS Authentication](./aws-auth.md)
- [Zero Trust Principles](./zero-trust.md)
- [Input Validation](../security-hardening/input-validation.md)
- [Security Best Practices](../security-hardening/best-practices.md)

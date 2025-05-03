# AWS Integration

This document explains how ZeroTrustKerberosLink integrates with AWS services, allowing Kerberos-authenticated users to securely access AWS resources.

## Overview

ZeroTrustKerberosLink bridges enterprise Kerberos authentication with AWS services by:

1. Authenticating users via Kerberos
2. Mapping Kerberos principals to appropriate AWS IAM roles
3. Assuming those roles to obtain temporary AWS credentials
4. Delivering those credentials to authenticated users

This integration follows Zero Trust principles by continuously validating user identity and context before granting access to AWS resources.

## AWS Integration Architecture

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│              │     │                   │     │                  │
│  Enterprise  │     │  ZeroTrust        │     │  AWS Security    │
│  User        │────▶│  KerberosLink     │────▶│  Token Service   │
│              │     │                   │     │                  │
└──────────────┘     └───────────────────┘     └──────────────────┘
                              │                          │
                              │                          │
                              ▼                          ▼
                     ┌───────────────────┐     ┌──────────────────┐
                     │                   │     │                  │
                     │  Role Mapping     │     │  Temporary AWS   │
                     │  Configuration    │     │  Credentials     │
                     │                   │     │                  │
                     └───────────────────┘     └──────────────────┘
                                                        │
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │                  │
                                               │  AWS Services    │
                                               │                  │
                                               └──────────────────┘
```

## AWS IAM Role Setup

### Trust Relationship

ZeroTrustKerberosLink requires IAM roles with appropriate trust relationships. The trust policy determines which entities can assume the role.

Example trust policy for an EC2 instance running ZeroTrustKerberosLink:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

For cross-account access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/ZeroTrustKerberosLinkRole"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalTag/KerberosPrincipal": "${aws:username}"
        }
      }
    }
  ]
}
```

### Required Permissions

ZeroTrustKerberosLink needs permissions to assume other roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": [
        "arn:aws:iam::123456789012:role/AdminRole",
        "arn:aws:iam::123456789012:role/DeveloperRole",
        "arn:aws:iam::123456789012:role/ReadOnlyRole"
      ]
    }
  ]
}
```

## Role Mapping Configuration

ZeroTrustKerberosLink maps Kerberos principals to AWS roles using configuration rules:

### Basic Role Mapping

```yaml
aws:
  role_mappings:
    - kerberos_principal: "admin@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/AdminRole"
    
    - kerberos_principal: "developer@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"
    
    - kerberos_principal: "*@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/ReadOnlyRole"
```

### Advanced Role Mapping with Conditions

```yaml
aws:
  role_mappings:
    - kerberos_principal: "admin@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/AdminRole"
      conditions:
        ip_ranges: ["10.0.0.0/8"]
        time_window: ["08:00-18:00"]
        days: ["Monday-Friday"]
    
    - kerberos_principal: "developer@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"
      conditions:
        require_mfa: true
```

### Pattern Matching

ZeroTrustKerberosLink supports pattern matching for Kerberos principals:

- Exact match: `admin@EXAMPLE.COM`
- Prefix match: `dev*@EXAMPLE.COM` (matches all developers)
- Suffix match: `*@finance.EXAMPLE.COM` (matches all finance users)
- Wildcard match: `*@EXAMPLE.COM` (matches all users in the realm)

## AWS STS Integration

### AssumeRole Operation

ZeroTrustKerberosLink uses the AWS Security Token Service (STS) AssumeRole operation to obtain temporary credentials:

```python
# Pseudocode for AWS STS integration
def assume_aws_role(aws_role_arn, kerberos_principal, session_duration=3600):
    # Create session name from Kerberos principal
    session_name = kerberos_principal.replace("@", "-").replace(".", "-")
    
    # Set session tags with Kerberos principal
    session_tags = [
        {
            "Key": "KerberosPrincipal",
            "Value": kerberos_principal
        }
    ]
    
    # Assume the role
    response = sts_client.assume_role(
        RoleArn=aws_role_arn,
        RoleSessionName=session_name,
        DurationSeconds=session_duration,
        Tags=session_tags
    )
    
    return response["Credentials"]
```

### Session Duration

The default session duration is 1 hour (3600 seconds). This can be configured:

```yaml
aws:
  session:
    default_duration: 3600  # 1 hour
    max_duration: 14400     # 4 hours (maximum 12 hours)
    renewal_enabled: true
```

### Session Tags

ZeroTrustKerberosLink adds session tags to provide context for AWS services:

```json
[
  {
    "Key": "KerberosPrincipal",
    "Value": "user@EXAMPLE.COM"
  },
  {
    "Key": "AuthTime",
    "Value": "2025-05-01T10:15:23Z"
  },
  {
    "Key": "ClientIP",
    "Value": "10.1.2.3"
  }
]
```

These tags can be used in AWS policies for additional access control.

## Cross-Account Access

ZeroTrustKerberosLink supports access to AWS resources across multiple accounts:

### Cross-Account Configuration

```yaml
aws:
  cross_account:
    enabled: true
    accounts:
      - account_id: "123456789012"
        name: "Production"
        roles:
          - name: "AdminRole"
            principal_pattern: "admin@EXAMPLE.COM"
          - name: "ReadOnlyRole"
            principal_pattern: "*@EXAMPLE.COM"
      
      - account_id: "987654321098"
        name: "Development"
        roles:
          - name: "DeveloperRole"
            principal_pattern: "dev*@EXAMPLE.COM"
```

### Cross-Account Trust Policy

Each target account needs a trust policy allowing the ZeroTrustKerberosLink account to assume roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::111122223333:role/ZeroTrustKerberosLinkRole"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringLike": {
          "aws:PrincipalTag/KerberosPrincipal": "dev*@EXAMPLE.COM"
        }
      }
    }
  ]
}
```

## AWS Credential Delivery

### API Response

ZeroTrustKerberosLink delivers temporary AWS credentials via API response:

```json
{
  "credentials": {
    "AccessKeyId": "ASIA1234567890EXAMPLE",
    "SecretAccessKey": "secretkey1234567890example",
    "SessionToken": "sessiontoken1234567890example",
    "Expiration": "2025-05-01T11:15:23Z"
  },
  "assumed_role": "arn:aws:iam::123456789012:role/DeveloperRole",
  "principal": "developer@EXAMPLE.COM"
}
```

### AWS CLI Profile Generation

ZeroTrustKerberosLink can generate AWS CLI profiles:

```yaml
aws:
  credential_formats:
    cli_profile:
      enabled: true
      profile_name: "kerberos-{principal}"
```

Example generated profile:

```ini
[profile kerberos-developer]
aws_access_key_id = ASIA1234567890EXAMPLE
aws_secret_access_key = secretkey1234567890example
aws_session_token = sessiontoken1234567890example
region = us-west-2
output = json
```

### Environment Variables

ZeroTrustKerberosLink can output environment variable commands:

```bash
export AWS_ACCESS_KEY_ID=ASIA1234567890EXAMPLE
export AWS_SECRET_ACCESS_KEY=secretkey1234567890example
export AWS_SESSION_TOKEN=sessiontoken1234567890example
export AWS_REGION=us-west-2
```

## Security Features

### Credential Encryption

Credentials are encrypted in transit:

```yaml
aws:
  security:
    encrypt_credentials: true
    encryption_key_file: "/etc/zerotrustkerberos/secrets/credential_encryption_key"
```

### Access Logging

All AWS role assumptions are logged:

```json
{
  "timestamp": "2025-05-01T10:15:23Z",
  "event": "aws_role_assumption",
  "principal": "developer@EXAMPLE.COM",
  "aws_role": "arn:aws:iam::123456789012:role/DeveloperRole",
  "client_ip": "10.1.2.3",
  "session_duration": 3600,
  "user_agent": "curl/7.68.0"
}
```

### Credential Revocation

ZeroTrustKerberosLink supports credential revocation:

```yaml
aws:
  security:
    revocation:
      enabled: true
      check_interval: 60  # seconds
```

When a user's access is revoked, ZeroTrustKerberosLink can:

1. Add the session to a revocation list
2. Notify monitoring systems
3. Generate CloudTrail events

## AWS Service Integration

### AWS CloudTrail

ZeroTrustKerberosLink integrates with AWS CloudTrail for audit logging:

```yaml
aws:
  cloudtrail:
    enabled: true
    include_user_identity: true
```

CloudTrail events include:

- Kerberos principal in user identity
- Role assumption details
- Context information

### AWS CloudWatch

ZeroTrustKerberosLink can send metrics to CloudWatch:

```yaml
aws:
  cloudwatch:
    enabled: true
    namespace: "ZeroTrustKerberosLink"
    region: "us-west-2"
    metrics:
      - name: "AuthenticationCount"
        unit: "Count"
      - name: "RoleAssumptionLatency"
        unit: "Milliseconds"
```

### AWS IAM Access Analyzer

ZeroTrustKerberosLink can integrate with IAM Access Analyzer:

```yaml
aws:
  access_analyzer:
    enabled: true
    analyzer_arn: "arn:aws:access-analyzer:us-west-2:123456789012:analyzer/MyAnalyzer"
```

## Advanced Configuration

### AWS Region Configuration

Configure AWS regions:

```yaml
aws:
  region: "us-west-2"  # Default region
  allowed_regions:
    - "us-west-2"
    - "us-east-1"
    - "eu-west-1"
```

### AWS API Endpoint Configuration

Configure custom AWS API endpoints:

```yaml
aws:
  endpoints:
    sts: "https://sts.us-west-2.amazonaws.com"
```

### AWS SDK Configuration

Configure AWS SDK options:

```yaml
aws:
  sdk:
    max_retries: 3
    timeout: 10  # seconds
    connection_pool_size: 10
```

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| "Access Denied" when assuming role | Incorrect trust policy | Check trust relationship in IAM role |
| "Role not found" | Role ARN typo or role doesn't exist | Verify role ARN and existence |
| "Invalid external ID" | External ID mismatch | Check external ID configuration |
| Short credential lifetime | Role session duration limit | Check max session duration in role settings |

### AWS Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `AccessDenied` | Permission issue | Check IAM permissions and trust policy |
| `InvalidClientTokenId` | Invalid access key | Check AWS credentials |
| `ExpiredToken` | Token has expired | Refresh credentials |
| `ThrottlingException` | API rate limit exceeded | Implement exponential backoff |

## Best Practices

1. **Least Privilege**: Assign the minimum permissions necessary
2. **Short-lived Credentials**: Use short session durations
3. **Conditional Access**: Use conditions in role mappings
4. **Audit Logging**: Enable comprehensive logging
5. **Regular Rotation**: Rotate service credentials regularly
6. **Monitoring**: Monitor role assumptions for unusual patterns
7. **Cross-Account Isolation**: Use separate accounts for different environments

## Related Documentation

- [Authentication Flow](./auth-flow.md)
- [Zero Trust Principles](./zero-trust.md)
- [Implementation Guide](../implementation-guide/index.md)
- [Custom Policies](../implementation-guide/custom-policies.md)

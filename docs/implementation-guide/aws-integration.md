# AWS Integration Guide

This guide provides comprehensive information on integrating ZeroTrustKerberosLink with AWS services and infrastructure.

## Overview

ZeroTrustKerberosLink bridges your enterprise Kerberos authentication with AWS services, allowing users to access AWS resources using their existing Kerberos credentials while maintaining strong security controls.

## Prerequisites

Before integrating ZeroTrustKerberosLink with AWS, ensure you have:

1. **AWS Account**: Active AWS account with administrative access
2. **IAM Permissions**: Permissions to create IAM roles and policies
3. **Networking**: Network connectivity between ZeroTrustKerberosLink and AWS services
4. **Kerberos Infrastructure**: Properly configured Kerberos environment

## AWS IAM Configuration

### Service Role

Create an IAM role for ZeroTrustKerberosLink to assume AWS roles on behalf of users:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::*:role/ZeroTrustKerberos*"
    }
  ]
}
```

### User Roles

Create IAM roles that ZeroTrustKerberosLink will map to Kerberos principals:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/ZeroTrustKerberosLinkServiceRole"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "aws:PrincipalTag/KerberosPrincipal": "${kerberos:principal}"
        }
      }
    }
  ]
}
```

### Role Permissions

Configure appropriate permissions for each role based on the principle of least privilege:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::example-bucket",
        "arn:aws:s3:::example-bucket/*"
      ]
    }
  ]
}
```

## AWS STS Configuration

### Regional Endpoints

Configure ZeroTrustKerberosLink to use regional STS endpoints for better performance and availability:

```yaml
aws:
  sts:
    regional_endpoints: true
    region: "us-west-2"
```

### Cross-Account Access

Configure cross-account access to allow users to access resources in multiple AWS accounts:

```yaml
aws:
  accounts:
    - id: "123456789012"
      name: "Production"
      roles:
        - "arn:aws:iam::123456789012:role/AdminRole"
        - "arn:aws:iam::123456789012:role/DeveloperRole"
    - id: "456789012345"
      name: "Development"
      roles:
        - "arn:aws:iam::456789012345:role/AdminRole"
        - "arn:aws:iam::456789012345:role/DeveloperRole"
```

## AWS Service Integration

### AWS CloudTrail

Enable AWS CloudTrail to audit role assumption activities:

```yaml
aws:
  cloudtrail:
    enabled: true
    trail_name: "ZeroTrustKerberosLinkTrail"
    s3_bucket: "zerotrustkerberos-logs"
    include_global_service_events: true
```

### AWS CloudWatch

Configure CloudWatch for monitoring and alerting:

```yaml
aws:
  cloudwatch:
    enabled: true
    log_group: "/zerotrustkerberos"
    metrics:
      enabled: true
      namespace: "ZeroTrustKerberosLink"
    alarms:
      enabled: true
      sns_topic: "arn:aws:sns:us-west-2:123456789012:ZeroTrustAlerts"
```

### AWS Secrets Manager

Use AWS Secrets Manager to securely store sensitive configuration:

```yaml
aws:
  secrets_manager:
    enabled: true
    region: "us-west-2"
    secret_id: "zerotrustkerberos/config"
```

## AWS Network Integration

### VPC Configuration

Deploy ZeroTrustKerberosLink in an AWS VPC for secure network integration:

```yaml
aws:
  vpc:
    id: "vpc-12345678"
    subnets:
      - "subnet-12345678"
      - "subnet-87654321"
    security_groups:
      - "sg-12345678"
```

### AWS PrivateLink

Use AWS PrivateLink to securely access AWS services without traversing the public internet:

```yaml
aws:
  privatelink:
    enabled: true
    services:
      - "com.amazonaws.us-west-2.sts"
      - "com.amazonaws.us-west-2.secretsmanager"
```

## AWS Authentication Flow

The authentication flow between ZeroTrustKerberosLink and AWS follows these steps:

1. User authenticates to ZeroTrustKerberosLink using Kerberos
2. ZeroTrustKerberosLink validates the Kerberos ticket
3. ZeroTrustKerberosLink maps the Kerberos principal to an AWS IAM role
4. ZeroTrustKerberosLink calls AWS STS AssumeRole API
5. AWS STS returns temporary credentials
6. ZeroTrustKerberosLink returns the temporary credentials to the user

```
┌─────────┐          ┌─────────────────┐          ┌─────────┐
│         │          │                 │          │         │
│  User   │          │  ZeroTrust      │          │  AWS    │
│         │          │  KerberosLink   │          │  STS    │
│         │          │                 │          │         │
└────┬────┘          └────────┬────────┘          └────┬────┘
     │                        │                         │
     │ 1. Kerberos Auth       │                         │
     │ ───────────────────►   │                         │
     │                        │                         │
     │                        │ 2. AssumeRole           │
     │                        │ ────────────────────►   │
     │                        │                         │
     │                        │ 3. Temporary Credentials│
     │                        │ ◄────────────────────   │
     │                        │                         │
     │ 4. Temporary Credentials                         │
     │ ◄───────────────────   │                         │
     │                        │                         │
```

## Security Considerations

When integrating with AWS, follow these security best practices:

<div class="security-feature">
  <h4>Use IAM Roles</h4>
  <p>Always use IAM roles with temporary credentials instead of long-term access keys.</p>
</div>

<div class="security-feature">
  <h4>Implement Least Privilege</h4>
  <p>Grant only the permissions necessary for each role.</p>
</div>

<div class="security-feature">
  <h4>Enable CloudTrail</h4>
  <p>Enable AWS CloudTrail to audit all API calls and role assumptions.</p>
</div>

<div class="security-feature">
  <h4>Use Conditions in Trust Policies</h4>
  <p>Implement conditions in role trust policies to restrict when roles can be assumed.</p>
</div>

<div class="security-feature">
  <h4>Secure Network Communication</h4>
  <p>Use VPC endpoints or PrivateLink to securely communicate with AWS services.</p>
</div>

## Troubleshooting

Common AWS integration issues include:

| Issue | Possible Causes | Resolution |
|-------|-----------------|------------|
| Role assumption failure | Insufficient permissions, trust policy issues | Check role trust policy, verify permissions |
| Expired credentials | Credential expiration | Refresh credentials before expiration |
| Permission denied | Insufficient role permissions, restrictive session policy | Check role permissions, review session policy |
| Rate limiting | Too many API calls | Implement exponential backoff, reduce request frequency |
| Network connectivity | VPC configuration, security groups | Check network connectivity, verify security group rules |

## Related Documentation

- [AWS Authentication](../core-concepts/aws-auth.md)
- [Role Mapping](../core-concepts/role-mapping.md)
- [Security Model](../core-concepts/security-model.md)
- [High Availability](./high-availability.md)

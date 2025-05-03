# AWS Authentication

This document explains how ZeroTrustKerberosLink integrates with AWS authentication mechanisms to provide secure access to AWS resources.

## AWS Authentication Concepts

AWS provides several authentication mechanisms for accessing resources:

- **IAM Users**: Long-term credentials for direct access
- **IAM Roles**: Temporary credentials for federated access
- **AWS STS**: Service that provides temporary credentials
- **Identity Federation**: Integration with external identity providers

## AWS STS and Temporary Credentials

ZeroTrustKerberosLink uses AWS Security Token Service (STS) to obtain temporary credentials:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│  Kerberos   │──────▶ ZeroTrust   │──────▶   AWS STS   │
│  Principal  │      │ KerberosLink│      │   Service   │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │             │
                                          │  Temporary  │
                                          │  AWS        │
                                          │  Credentials│
                                          │             │
                                          └─────────────┘
```

### Temporary Credential Components

Temporary credentials consist of:

- **Access Key ID**: Identifies the temporary credentials
- **Secret Access Key**: Used to sign requests
- **Session Token**: Validates the temporary credentials
- **Expiration**: Time when the credentials expire

Example temporary credentials:

```json
{
  "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",
  "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "SessionToken": "AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT+FvwqnKwRcOIfrRh3c/LTo6UDdyJwOOvEVPvLXCrrrUtdnniCEXAMPLE/IvU1dYUg2RVAJBanLiHb4IgRmpRV3zrkuWJOgQs8IZZaIv2BXIa2R4Olgk",
  "Expiration": "2025-05-02T12:00:00Z"
}
```

## AWS IAM Role Assumption

ZeroTrustKerberosLink uses the `AssumeRole` API to obtain temporary credentials:

```yaml
# Example AssumeRole API call
operation: AssumeRole
parameters:
  RoleArn: "arn:aws:iam::123456789012:role/UserRole"
  RoleSessionName: "KerberosUser-user@EXAMPLE.COM"
  DurationSeconds: 3600
```

### Role Trust Policy

AWS IAM roles must have a trust policy that allows ZeroTrustKerberosLink to assume the role:

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
          "aws:PrincipalTag/KerberosPrincipal": "user@EXAMPLE.COM"
        }
      }
    }
  ]
}
```

## Role Chaining

ZeroTrustKerberosLink supports role chaining, where one AWS role is used to assume another:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │      │             │
│  Kerberos   │──────▶ ZeroTrust   │──────▶  Initial    │──────▶  Target     │
│  Principal  │      │ KerberosLink│      │  AWS Role   │      │  AWS Role   │
│             │      │             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

Example role chaining configuration:

```yaml
aws:
  role_mappings:
    - kerberos_principal: "user@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/InitialRole"
      chained_role: "arn:aws:iam::456789012345:role/TargetRole"
```

## Session Policies

ZeroTrustKerberosLink can apply session policies to further restrict permissions:

```yaml
aws:
  role_mappings:
    - kerberos_principal: "user@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/UserRole"
      session_policy: |
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Deny",
              "Action": "s3:DeleteBucket",
              "Resource": "*"
            }
          ]
        }
```

## External ID

For enhanced security, ZeroTrustKerberosLink can use an external ID when assuming roles:

```yaml
aws:
  role_mappings:
    - kerberos_principal: "user@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/UserRole"
      external_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Security Considerations

When implementing AWS authentication, follow these best practices:

<div class="security-feature">
  <h4>Use Temporary Credentials</h4>
  <p>Always use temporary credentials with appropriate expiration times.</p>
</div>

<div class="security-feature">
  <h4>Implement Least Privilege</h4>
  <p>Grant only the permissions necessary for the task at hand.</p>
</div>

<div class="security-feature">
  <h4>Use Conditional Role Assumption</h4>
  <p>Implement conditions in role trust policies to restrict when roles can be assumed.</p>
</div>

<div class="security-feature">
  <h4>Apply Session Policies</h4>
  <p>Use session policies to further restrict permissions granted by roles.</p>
</div>

<div class="security-feature">
  <h4>Audit Role Assumptions</h4>
  <p>Enable AWS CloudTrail to audit role assumption activities.</p>
</div>

## Troubleshooting AWS Authentication

Common AWS authentication issues include:

| Issue | Possible Causes | Resolution |
|-------|-----------------|------------|
| Role assumption failure | Insufficient permissions, trust policy issues | Check role trust policy, verify permissions |
| Expired credentials | Credential expiration | Refresh credentials before expiration |
| Permission denied | Insufficient role permissions, restrictive session policy | Check role permissions, review session policy |
| Rate limiting | Too many API calls | Implement exponential backoff, reduce request frequency |
| Region issues | Incorrect AWS region | Configure correct region, use regional STS endpoints |

## Related Documentation

- [Kerberos Authentication](./kerberos.md)
- [Authentication Flow](./auth-flow.md)
- [Role Mapping](./role-mapping.md)
- [Zero Trust Principles](./zero-trust.md)

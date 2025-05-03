# Role Mapping

Role mapping is a core concept in ZeroTrustKerberosLink that connects Kerberos principals to AWS IAM roles, enabling secure access to AWS resources based on existing enterprise identities.

## Concept Overview

Role mapping establishes the relationship between:

- **Kerberos Principals**: Enterprise identities authenticated via Kerberos
- **AWS IAM Roles**: AWS roles that provide access to AWS resources

This mapping allows users to authenticate once with their enterprise credentials and gain appropriate access to AWS resources without managing separate AWS credentials.

## How Role Mapping Works

```
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│               │      │               │      │               │
│   Kerberos    │──────▶ ZeroTrust     │──────▶   AWS STS     │
│   Principal   │      │ KerberosLink  │      │   Service     │
│               │      │               │      │               │
└───────────────┘      └───────────────┘      └───────────────┘
                              │                       │
                              ▼                       ▼
                       ┌───────────────┐      ┌───────────────┐
                       │               │      │               │
                       │ Role Mapping  │      │  Temporary    │
                       │ Configuration │      │  AWS          │
                       │               │      │  Credentials  │
                       └───────────────┘      └───────────────┘
```

1. A user authenticates using their Kerberos credentials
2. ZeroTrustKerberosLink validates the Kerberos ticket
3. The system looks up the appropriate AWS IAM role based on the mapping configuration
4. ZeroTrustKerberosLink assumes the IAM role via AWS STS
5. Temporary AWS credentials are returned to the user

## Mapping Configuration

Role mappings are defined in the configuration file using a flexible syntax:

```yaml
aws:
  role_mappings:
    - kerberos_principal: "admin@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/AdminRole"
      conditions:
        ip_ranges: ["10.0.0.0/8"]
        time_window: ["08:00-18:00"]
    
    - kerberos_principal: "developer@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"
    
    - kerberos_principal_pattern: "*.service@EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/ServiceRole"
```

## Mapping Types

ZeroTrustKerberosLink supports several types of mappings:

### Direct Mapping

Maps a specific Kerberos principal to a specific AWS role:

```yaml
- kerberos_principal: "user@EXAMPLE.COM"
  aws_role: "arn:aws:iam::123456789012:role/UserRole"
```

### Pattern Mapping

Maps Kerberos principals matching a pattern to an AWS role:

```yaml
- kerberos_principal_pattern: "dev-*@EXAMPLE.COM"
  aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"
```

### Group Mapping

Maps Kerberos principals belonging to specific groups to AWS roles:

```yaml
- kerberos_group: "developers"
  aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"
```

### Default Mapping

Provides a fallback role when no specific mapping matches:

```yaml
aws:
  default_role: "arn:aws:iam::123456789012:role/DefaultRole"
```

## Conditional Mappings

Role mappings can include conditions that must be satisfied for the mapping to apply:

### IP Range Conditions

Restrict role assumption to specific IP ranges:

```yaml
- kerberos_principal: "admin@EXAMPLE.COM"
  aws_role: "arn:aws:iam::123456789012:role/AdminRole"
  conditions:
    ip_ranges: ["10.0.0.0/8", "172.16.0.0/12"]
```

### Time Window Conditions

Restrict role assumption to specific time windows:

```yaml
- kerberos_principal: "developer@EXAMPLE.COM"
  aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"
  conditions:
    time_window: ["08:00-18:00"]
    days: ["Monday-Friday"]
```

### Multi-Factor Authentication Conditions

Require MFA for role assumption:

```yaml
- kerberos_principal: "admin@EXAMPLE.COM"
  aws_role: "arn:aws:iam::123456789012:role/AdminRole"
  conditions:
    require_mfa: true
```

## Role Chaining

ZeroTrustKerberosLink supports role chaining, where one AWS role is used to assume another:

```yaml
- kerberos_principal: "user@EXAMPLE.COM"
  aws_role: "arn:aws:iam::123456789012:role/InitialRole"
  chained_role: "arn:aws:iam::456789012345:role/TargetRole"
```

## Role Session Configuration

Configure the properties of the AWS role session:

```yaml
- kerberos_principal: "user@EXAMPLE.COM"
  aws_role: "arn:aws:iam::123456789012:role/UserRole"
  session_name: "KerberosUser-{principal}"
  session_duration: "1h"
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

## Security Considerations

When configuring role mappings, follow these best practices:

<div class="security-feature">
  <h4>Apply Least Privilege</h4>
  <p>Map users to AWS roles with the minimum permissions necessary for their job functions.</p>
</div>

<div class="security-feature">
  <h4>Use Conditional Mappings</h4>
  <p>Implement conditions based on IP ranges, time windows, and other contextual factors to enhance security.</p>
</div>

<div class="security-feature">
  <h4>Require MFA for Sensitive Roles</h4>
  <p>Configure MFA requirements for roles that provide access to sensitive resources.</p>
</div>

<div class="security-feature">
  <h4>Limit Session Duration</h4>
  <p>Configure appropriate session durations based on security requirements.</p>
</div>

<div class="security-feature">
  <h4>Audit Role Mappings</h4>
  <p>Regularly review role mappings to ensure they remain appropriate and secure.</p>
</div>

## Related Documentation

- [Authentication Flow](./auth-flow.md)
- [Security Model](./security-model.md)
- [AWS Integration](../implementation-guide/aws-integration.md)
- [Custom Policies](../implementation-guide/custom-policies.md)

# Custom Policies

This guide explains how to implement custom policies in ZeroTrustKerberosLink to control access based on various conditions and context.

## Overview

Custom policies allow you to define fine-grained access control rules that determine:

1. Which Kerberos principals can access which AWS roles
2. Under what conditions access is granted
3. How context information affects authorization decisions

## Policy Structure

ZeroTrustKerberosLink policies consist of three main components:

### 1. Principal Matching

Determines which Kerberos principals the policy applies to:

```yaml
principals:
  - "admin@EXAMPLE.COM"           # Exact match
  - "developer*@EXAMPLE.COM"      # Wildcard match
  - "*.finance@EXAMPLE.COM"       # Department match
  - "*@EXAMPLE.COM"               # All users in realm
```

### 2. AWS Role Mapping

Specifies which AWS role(s) to map to:

```yaml
aws_roles:
  - arn: "arn:aws:iam::123456789012:role/AdminRole"
    priority: 10
  - arn: "arn:aws:iam::123456789012:role/ReadOnlyRole"
    priority: 20
```

### 3. Conditions

Defines conditions that must be met for the policy to apply:

```yaml
conditions:
  ip_ranges:
    - "10.0.0.0/8"
    - "192.168.1.0/24"
  time_window: "08:00-18:00"
  days: "Monday-Friday"
  require_mfa: true
  max_risk_score: 25
```

## Basic Policy Examples

### Simple Role Mapping

```yaml
# Map specific user to admin role
policies:
  - name: "Admin Access"
    principals:
      - "admin@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/AdminRole"
```

### Department-Based Mapping

```yaml
# Map finance department to finance role
policies:
  - name: "Finance Access"
    principals:
      - "*.finance@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/FinanceRole"
```

### Default Access

```yaml
# Default role for all users
policies:
  - name: "Default Access"
    principals:
      - "*@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/ReadOnlyRole"
    priority: 100  # Lower priority, applied last
```

## Advanced Policy Examples

### Time-Based Access

```yaml
# Allow admin access only during business hours
policies:
  - name: "Business Hours Admin Access"
    principals:
      - "admin@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/AdminRole"
    conditions:
      time_window: "08:00-18:00"
      days: "Monday-Friday"
```

### Location-Based Access

```yaml
# Allow access only from corporate network
policies:
  - name: "Corporate Network Access"
    principals:
      - "*@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/DeveloperRole"
    conditions:
      ip_ranges:
        - "10.0.0.0/8"  # Corporate network
```

### Risk-Based Access

```yaml
# Restrict sensitive role based on risk score
policies:
  - name: "Production Access"
    principals:
      - "devops*@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/ProductionRole"
    conditions:
      max_risk_score: 25  # Low risk only
      require_mfa: true   # Require MFA
```

## Context Evaluation

ZeroTrustKerberosLink evaluates various context factors when applying policies:

### Available Context Factors

| Factor | Description | Example |
|--------|-------------|---------|
| IP Address | Client IP address | "10.1.2.3" |
| Time | Current time | "14:35:22" |
| Day | Current day | "Monday" |
| User Agent | Client user agent | "curl/7.68.0" |
| Device | Client device information | "MacBook Pro" |
| Location | Geographic location | "New York, US" |
| Authentication Method | How user authenticated | "Kerberos" |
| MFA Status | Whether MFA was used | "true" |
| Previous Auth | Previous authentication data | "2 hours ago, same IP" |

### Risk Scoring

Risk scores are calculated based on context factors:

```yaml
# Risk scoring configuration
risk_scoring:
  enabled: true
  factors:
    unknown_ip:
      weight: 30
      description: "Access from unknown IP address"
    off_hours:
      weight: 20
      description: "Access outside business hours"
    new_device:
      weight: 15
      description: "Access from new device"
    unusual_location:
      weight: 25
      description: "Access from unusual location"
  thresholds:
    low: 0-25
    medium: 26-50
    high: 51-100
```

## Custom Policy Implementation

### Policy File Structure

Create a `policies.yaml` file:

```yaml
version: "1.0"
default_policy: "deny"  # deny or allow

policies:
  - name: "Admin Access"
    principals:
      - "admin@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/AdminRole"
    conditions:
      ip_ranges:
        - "10.0.0.0/8"
      time_window: "08:00-18:00"
      days: "Monday-Friday"
    priority: 10
  
  - name: "Developer Access"
    principals:
      - "dev*@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/DeveloperRole"
    conditions:
      require_mfa: true
    priority: 20
  
  - name: "Default Access"
    principals:
      - "*@EXAMPLE.COM"
    aws_roles:
      - arn: "arn:aws:iam::123456789012:role/ReadOnlyRole"
    priority: 100
```

### Loading Custom Policies

Configure ZeroTrustKerberosLink to use your custom policies:

```yaml
# config.yaml
policies:
  file: "/etc/zerotrustkerberos/policies.yaml"
  reload_interval: 300  # seconds
  default_action: "deny"
```

## Policy Evaluation Logic

ZeroTrustKerberosLink evaluates policies in this order:

1. Match principal against policy principals
2. For matching policies, evaluate conditions
3. For policies with satisfied conditions, select highest priority (lowest number)
4. If no policy matches, apply default action

```
┌─────────────────┐
│                 │
│  Authentication │
│  Success        │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│                 │
│  Extract        │
│  Principal      │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│                 │
│  Collect        │
│  Context        │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│                 │
│  Calculate      │
│  Risk Score     │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│                 │
│  Match          │
│  Policies       │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No     ┌──────────────┐
│  Any Policy     │────────────▶│ Apply        │
│  Matches?       │            │ Default      │
│                 │            │ Action       │
└────────┬────────┘            └──────────────┘
         │ Yes
         ▼
┌─────────────────┐
│                 │
│  Select Highest │
│  Priority       │
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│                 │
│  Assume         │
│  AWS Role       │
│                 │
└─────────────────┘
```

## Testing Policies

### Policy Simulator

Use the policy simulator to test policies without affecting production:

```bash
zerotrustkerberos-cli simulate-policy \
  --principal "developer@EXAMPLE.COM" \
  --ip "10.1.2.3" \
  --time "14:30" \
  --day "Monday" \
  --mfa true
```

Example output:

```
Policy Simulation Results:
--------------------------
Principal: developer@EXAMPLE.COM
Context:
  - IP: 10.1.2.3
  - Time: 14:30
  - Day: Monday
  - MFA: true
  - Risk Score: 15 (Low)

Matching Policies:
1. "Developer Access" (Priority: 20)
   AWS Role: arn:aws:iam::123456789012:role/DeveloperRole
2. "Default Access" (Priority: 100)
   AWS Role: arn:aws:iam::123456789012:role/ReadOnlyRole

Selected Policy: "Developer Access" (Priority: 20)
Result: ALLOW - Role: arn:aws:iam::123456789012:role/DeveloperRole
```

### Policy Validation

Validate policy syntax before deployment:

```bash
zerotrustkerberos-cli validate-policies --file /etc/zerotrustkerberos/policies.yaml
```

## Best Practices

### Policy Design

1. **Least Privilege**: Start with minimal access and add permissions as needed
2. **Defense in Depth**: Use multiple conditions for sensitive roles
3. **Default Deny**: Set default policy to deny and explicitly allow access
4. **Role Separation**: Create separate policies for different job functions

### Policy Management

1. **Version Control**: Store policies in version control
2. **Regular Review**: Review and update policies regularly
3. **Audit Logging**: Enable detailed logging for policy decisions
4. **Documentation**: Document the purpose of each policy

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Policy not matching | Principal format mismatch | Check principal format in policy |
| Unexpected role | Policy priority issue | Check policy priorities |
| Condition failure | Context evaluation error | Check condition values and context |
| No matching policy | Missing or incorrect policy | Add appropriate policy or check existing ones |

### Debugging

Enable policy debugging for detailed information:

```yaml
logging:
  policy_decisions:
    enabled: true
    level: "debug"
```

View policy decision logs:

```bash
grep "policy decision" /var/log/zerotrustkerberos/app.log
```

## Related Documentation

- [Authentication Flow](../core-concepts/auth-flow.md)
- [AWS Integration](../core-concepts/aws-integration.md)
- [Zero Trust Principles](../core-concepts/zero-trust.md)
- [Implementation Guide](./index.md)

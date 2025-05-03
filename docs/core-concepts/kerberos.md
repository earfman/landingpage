# Kerberos Authentication

This document explains how ZeroTrustKerberosLink integrates with Kerberos authentication to provide secure access to AWS resources.

## What is Kerberos?

Kerberos is a network authentication protocol designed to provide strong authentication for client/server applications using secret-key cryptography. It allows users to prove their identity to services across a network without sending passwords.

### Key Kerberos Concepts

- **Principal**: An entity in Kerberos (user or service) that can be authenticated
- **KDC (Key Distribution Center)**: The trusted third party that issues tickets
- **Ticket**: A temporary credential that proves identity to a service
- **Realm**: A logical grouping of resources and identities under a single authentication domain
- **Keytab**: A file containing Kerberos principals and their encrypted keys

## Kerberos Authentication Flow

The Kerberos authentication process involves several steps:

```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│         │                  │         │                  │         │
│ Client  │                  │   KDC   │                  │ Service │
│         │                  │         │                  │         │
└────┬────┘                  └────┬────┘                  └────┬────┘
     │                            │                            │
     │ 1. Authentication Request  │                            │
     │ (User + Timestamp)         │                            │
     │ -------------------------► │                            │
     │                            │                            │
     │ 2. TGT + Session Key       │                            │
     │ ◄------------------------- │                            │
     │                            │                            │
     │ 3. Service Ticket Request  │                            │
     │ (TGT + Service Name)       │                            │
     │ -------------------------► │                            │
     │                            │                            │
     │ 4. Service Ticket          │                            │
     │ ◄------------------------- │                            │
     │                            │                            │
     │ 5. Service Request         │                            │
     │ (Service Ticket)           │                            │
     │ ---------------------------------------------► │        │
     │                            │                            │
     │ 6. Service Response        │                            │
     │ ◄--------------------------------------------- │        │
     │                            │                            │
```

1. **Authentication Request**: The client requests a Ticket Granting Ticket (TGT) from the KDC
2. **TGT Issuance**: The KDC issues a TGT and session key to the client
3. **Service Ticket Request**: The client uses the TGT to request a service ticket
4. **Service Ticket Issuance**: The KDC issues a service ticket to the client
5. **Service Authentication**: The client presents the service ticket to the service
6. **Service Access**: The service grants access to the client

## ZeroTrustKerberosLink Integration

ZeroTrustKerberosLink integrates with Kerberos in the following ways:

### Service Principal Configuration

ZeroTrustKerberosLink is configured with a service principal and keytab:

```yaml
kerberos:
  service_principal: "HTTP/zerotrustkerberos.example.com@EXAMPLE.COM"
  keytab_file: "/etc/zerotrustkerberos/keytab/service.keytab"
  realm: "EXAMPLE.COM"
  kdc: "kdc.example.com"
```

### Authentication Process

1. The user obtains a Kerberos ticket for the ZeroTrustKerberosLink service principal
2. The user presents the ticket to ZeroTrustKerberosLink
3. ZeroTrustKerberosLink validates the ticket using its keytab
4. ZeroTrustKerberosLink extracts the user's principal from the ticket
5. ZeroTrustKerberosLink maps the principal to an AWS IAM role
6. ZeroTrustKerberosLink assumes the role and returns temporary AWS credentials

### Supported Encryption Types

ZeroTrustKerberosLink supports the following Kerberos encryption types:

- `aes256-cts-hmac-sha1-96` (recommended)
- `aes128-cts-hmac-sha1-96`
- `des3-cbc-sha1` (not recommended for security reasons)

```yaml
kerberos:
  encryption_types:
    - "aes256-cts-hmac-sha1-96"
    - "aes128-cts-hmac-sha1-96"
  allow_weak_crypto: false
```

## Security Considerations

When implementing Kerberos authentication, follow these best practices:

<div class="security-feature">
  <h4>Use Strong Encryption</h4>
  <p>Configure Kerberos to use strong encryption types like AES256-CTS-HMAC-SHA1-96 and disable weak encryption types.</p>
</div>

<div class="security-feature">
  <h4>Protect Keytab Files</h4>
  <p>Secure keytab files with appropriate file permissions (0600) and restrict access to the service account only.</p>
</div>

<div class="security-feature">
  <h4>Synchronize Clocks</h4>
  <p>Ensure that all systems have synchronized clocks to prevent authentication failures due to time skew.</p>
</div>

<div class="security-feature">
  <h4>Implement Ticket Validation</h4>
  <p>Validate all aspects of Kerberos tickets, including encryption, timestamps, and replay protection.</p>
</div>

<div class="security-feature">
  <h4>Audit Authentication Events</h4>
  <p>Log all authentication events for security monitoring and compliance purposes.</p>
</div>

## Troubleshooting Kerberos Authentication

Common Kerberos authentication issues include:

| Issue | Possible Causes | Resolution |
|-------|-----------------|------------|
| Authentication failure | Invalid keytab, clock skew | Verify keytab with `klist -k`, synchronize clocks |
| Encryption type mismatch | Unsupported encryption types | Configure compatible encryption types |
| Ticket expiration | Short ticket lifetime | Increase ticket lifetime, implement ticket renewal |
| KDC unavailable | Network issues, KDC down | Check network connectivity, verify KDC status |
| Principal not found | Misconfigured service principal | Verify service principal configuration |

## Related Documentation

- [Zero Trust Principles](./zero-trust.md)
- [Authentication Flow](./auth-flow.md)
- [AWS Authentication](./aws-auth.md)
- [Role Mapping](./role-mapping.md)

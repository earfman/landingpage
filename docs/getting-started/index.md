# Getting Started with ZeroTrustKerberosLink

This guide will help you quickly set up ZeroTrustKerberosLink in your environment with a focus on security best practices.

## System Requirements

Before installing ZeroTrustKerberosLink, ensure your environment meets the following requirements:

### Hardware Requirements
- **CPU**: 2+ cores recommended
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Disk Space**: 2GB minimum for installation

### Software Requirements
- **Operating System**: Linux (Ubuntu 20.04+, RHEL 8+, or Amazon Linux 2)
- **Docker**: Version 20.10+ (for containerized deployment)
- **Docker Compose**: Version 2.0+ (for containerized deployment)
- **Python**: Version 3.8+ (for non-containerized deployment)

### Network Requirements
- **Outbound Access**: HTTPS access to AWS services
- **Inbound Access**: Access from client applications to ZeroTrustKerberosLink
- **Kerberos Access**: Network connectivity to your Kerberos KDC

## Installation Options

ZeroTrustKerberosLink can be installed using Docker (recommended) or directly on your host system.

### Docker Installation (Recommended)

1. **Download the Docker Compose file**:

   ```bash
   curl -o docker-compose.yml https://download.zerotrustkerberos.link/docker-compose.yml
   ```

2. **Create a configuration directory**:

   ```bash
   mkdir -p config
   curl -o config/config.example.yaml https://download.zerotrustkerberos.link/config.example.yaml
   cp config/config.example.yaml config/config.yaml
   ```

3. **Edit the configuration file**:

   ```bash
   nano config/config.yaml
   ```

4. **Start the containers**:

   ```bash
   docker-compose up -d
   ```

5. **Verify the installation**:

   ```bash
   curl http://localhost:8080/health
   ```

### Direct Installation

1. **Install system dependencies**:

   ```bash
   # Ubuntu/Debian
   apt-get update
   apt-get install -y python3 python3-pip krb5-user libkrb5-dev build-essential
   
   # RHEL/CentOS
   yum install -y python3 python3-pip krb5-workstation krb5-devel gcc
   ```

2. **Install ZeroTrustKerberosLink**:

   ```bash
   pip3 install zerotrustkerberos
   ```

3. **Create configuration directory**:

   ```bash
   mkdir -p /etc/zerotrustkerberos
   curl -o /etc/zerotrustkerberos/config.example.yaml https://download.zerotrustkerberos.link/config.example.yaml
   cp /etc/zerotrustkerberos/config.example.yaml /etc/zerotrustkerberos/config.yaml
   ```

4. **Edit the configuration file**:

   ```bash
   nano /etc/zerotrustkerberos/config.yaml
   ```

5. **Start the service**:

   ```bash
   zerotrustkerberos-service start
   ```

6. **Verify the installation**:

   ```bash
   curl http://localhost:8080/health
   ```

## Initial Configuration

After installation, you need to configure ZeroTrustKerberosLink for your environment.

### Basic Configuration

Edit the configuration file (`config.yaml`) with your settings:

```yaml
# Basic configuration
server:
  host: "0.0.0.0"
  port: 8080
  tls:
    enabled: true
    cert_file: "/path/to/cert.pem"
    key_file: "/path/to/key.pem"

# Kerberos configuration
kerberos:
  realm: "YOUR.REALM"
  kdc: "kdc.your-domain.com"
  admin_server: "admin-server.your-domain.com"
  keytab_path: "/etc/zerotrustkerberos/krb5.keytab"

# AWS configuration
aws:
  region: "us-west-2"
  role_mapping:
    - kerberos_principal: "admin@YOUR.REALM"
      aws_role: "arn:aws:iam::123456789012:role/AdminRole"
    - kerberos_principal: "developer@YOUR.REALM"
      aws_role: "arn:aws:iam::123456789012:role/DeveloperRole"

# Security configuration (recommended settings)
security:
  input_validation:
    enabled: true
    strict_mode: true
  
  headers:
    content_security_policy:
      enabled: true
    xss_protection:
      enabled: true
    content_type_options:
      enabled: true
    frame_options:
      enabled: true
    strict_transport_security:
      enabled: true
  
  rate_limiting:
    enabled: true
    requests_per_minute: 60
```

### Security Hardening (Recommended)

For enhanced security, enable these additional settings:

```yaml
# Enhanced security configuration
security:
  # Additional input validation settings
  input_validation:
    log_validation_failures: true
    xss_protection:
      sanitize_html: true
    injection_protection:
      sql_parameterization: true
    path_traversal_protection:
      enabled: true
  
  # Redis security (if using Redis)
  redis:
    tls:
      enabled: true
    auth:
      username: "zerotrustkerberos"
      password_env: "REDIS_PASSWORD"
  
  # Audit logging
  audit:
    enabled: true
    log_level: "info"
    log_format: "json"
```

## Setting Up Kerberos Integration

### Creating a Keytab File

1. **On your KDC server**, create a service principal:

   ```bash
   kadmin.local -q "addprinc -randkey HTTP/zerotrustkerberos.your-domain.com"
   ```

2. **Export the keytab**:

   ```bash
   kadmin.local -q "ktadd -k /tmp/zerotrustkerberos.keytab HTTP/zerotrustkerberos.your-domain.com"
   ```

3. **Transfer the keytab** to your ZeroTrustKerberosLink server:

   ```bash
   scp /tmp/zerotrustkerberos.keytab user@zerotrustkerberos-server:/etc/zerotrustkerberos/krb5.keytab
   ```

4. **Set proper permissions**:

   ```bash
   chmod 600 /etc/zerotrustkerberos/krb5.keytab
   chown zerotrustkerberos:zerotrustkerberos /etc/zerotrustkerberos/krb5.keytab
   ```

### Configuring Kerberos Client

Create or edit `/etc/krb5.conf`:

```
[libdefaults]
    default_realm = YOUR.REALM
    dns_lookup_realm = false
    dns_lookup_kdc = false
    ticket_lifetime = 24h
    renew_lifetime = 7d
    forwardable = true

[realms]
    YOUR.REALM = {
        kdc = kdc.your-domain.com
        admin_server = admin-server.your-domain.com
    }

[domain_realm]
    .your-domain.com = YOUR.REALM
    your-domain.com = YOUR.REALM
```

## Setting Up AWS Integration

### Creating IAM Roles

1. **Create an IAM role** in your AWS account:
   - Go to IAM Console > Roles > Create Role
   - Select "Custom trust policy"
   - Use the following trust policy:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::123456789012:role/ZeroTrustKerberosLinkRole"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }
   ```

2. **Attach appropriate permissions** to the role

3. **Update your configuration** with the role ARN:

   ```yaml
   aws:
     role_mapping:
       - kerberos_principal: "user@YOUR.REALM"
         aws_role: "arn:aws:iam::123456789012:role/UserRole"
   ```

## Verifying Your Installation

### Health Check

```bash
curl http://localhost:8080/health
```

Expected output:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "components": {
    "kerberos": "healthy",
    "aws": "healthy",
    "database": "healthy"
  }
}
```

### Authentication Test

Test authentication with your Kerberos credentials:

```bash
# Get a Kerberos ticket
kinit user@YOUR.REALM

# Test authentication
curl --negotiate -u : http://localhost:8080/auth/test
```

## Next Steps

Now that you have ZeroTrustKerberosLink installed and configured, you can:

1. [Configure security headers](../security-hardening/security-headers.md)
2. [Set up input validation](../security-hardening/input-validation.md)
3. [Secure Redis communication](../security-hardening/secure-redis.md)
4. [Run security tests](../security-hardening/security-testing.md)
5. [Explore advanced configuration options](../configuration/index.md)

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Kerberos authentication failure | Check keytab file permissions and principal names |
| AWS role assumption failure | Verify IAM role trust relationships and permissions |
| TLS certificate errors | Ensure certificate paths and permissions are correct |
| "Service unavailable" error | Check logs for startup errors and verify port availability |

### Logs

Check the logs for more detailed error information:

```bash
# Docker installation
docker-compose logs zerotrustkerberos

# Direct installation
journalctl -u zerotrustkerberos
```

## Getting Help

If you encounter issues not covered in this guide:

- **Email Support**: [contact@zerotrustkerberoslink.com](mailto:contact@zerotrustkerberoslink.com)
- **Documentation**: Explore the [complete documentation](../index.md)

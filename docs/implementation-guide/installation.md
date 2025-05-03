# Installation Guide

This guide provides comprehensive instructions for installing and setting up ZeroTrustKerberosLink in your environment, with a focus on security best practices.

## Prerequisites

Before installing ZeroTrustKerberosLink, ensure your environment meets the following requirements:

### System Requirements

- **Operating System**: Linux (RHEL/CentOS 8+, Ubuntu 20.04+, Debian 11+)
- **CPU**: 2+ cores recommended (4+ for production)
- **Memory**: 4GB RAM minimum (8GB+ recommended for production)
- **Disk**: 20GB available space
- **Network**: Outbound connectivity to AWS services and Kerberos KDC

### Software Requirements

- **Docker**: 20.10.0 or later (for containerized deployment)
- **Kubernetes**: 1.20+ (for Kubernetes deployment)
- **Python**: 3.8 or later (for non-containerized deployment)
- **Redis**: 6.0 or later (for session and cache storage)

### AWS Requirements

- AWS account with permissions to:
  - Create IAM roles and policies
  - Assume IAM roles
  - Access required AWS services

### Kerberos Requirements

- Kerberos KDC accessible from the ZeroTrustKerberosLink server
- Service principal for ZeroTrustKerberosLink
- Keytab file for the service principal

## Installation Methods

ZeroTrustKerberosLink can be installed using several methods:

### Docker Installation (Recommended)

1. **Pull the Docker image**:
   ```bash
   docker pull zerotrustkerberos/kerberos-aws-proxy:latest
   ```

2. **Create a configuration directory**:
   ```bash
   mkdir -p /etc/zerotrustkerberos/config
   mkdir -p /etc/zerotrustkerberos/certs
   mkdir -p /etc/zerotrustkerberos/keytab
   ```

3. **Create a configuration file**:
   ```bash
   cat > /etc/zerotrustkerberos/config/config.yaml << 'EOF'
   server:
     host: "0.0.0.0"
     port: 8443
     tls:
       enabled: true
       cert_file: "/etc/zerotrustkerberos/certs/server.pem"
       key_file: "/etc/zerotrustkerberos/certs/server-key.pem"
       min_version: "TLS1.2"
   
   kerberos:
     enabled: true
     service_principal: "HTTP/zerotrustkerberos.example.com@EXAMPLE.COM"
     keytab_file: "/etc/zerotrustkerberos/keytab/service.keytab"
     realm: "EXAMPLE.COM"
     encryption_types:
       - "aes256-cts-hmac-sha1-96"
     
   aws:
     region: "us-west-2"
     role_mappings:
       - kerberos_principal: "user@EXAMPLE.COM"
         aws_role: "arn:aws:iam::123456789012:role/UserRole"
   
   security:
     headers:
       enabled: true
       content_security_policy: "default-src 'self'"
       xss_protection: true
       content_type_options: true
       frame_options: "DENY"
     rate_limiting:
       enabled: true
       default_limit: 60
     input_validation:
       enabled: true
       sanitize_html: true
   
   logging:
     level: "info"
     format: "json"
     output:
       - type: "file"
         path: "/var/log/zerotrustkerberos/server.log"
   
   audit:
     enabled: true
     format: "json"
     output:
       - type: "file"
         path: "/var/log/zerotrustkerberos/audit.log"
   EOF
   ```

4. **Copy your TLS certificates and Kerberos keytab**:
   ```bash
   # Copy TLS certificates
   cp /path/to/your/cert.pem /etc/zerotrustkerberos/certs/server.pem
   cp /path/to/your/key.pem /etc/zerotrustkerberos/certs/server-key.pem
   
   # Copy Kerberos keytab
   cp /path/to/your/keytab /etc/zerotrustkerberos/keytab/service.keytab
   
   # Set proper permissions
   chmod 600 /etc/zerotrustkerberos/certs/server-key.pem
   chmod 600 /etc/zerotrustkerberos/keytab/service.keytab
   ```

5. **Run the Docker container**:
   ```bash
   docker run -d \
     --name zerotrustkerberos \
     -p 8443:8443 \
     -v /etc/zerotrustkerberos:/etc/zerotrustkerberos \
     -v /var/log/zerotrustkerberos:/var/log/zerotrustkerberos \
     --restart unless-stopped \
     zerotrustkerberos/kerberos-aws-proxy:latest
   ```

### Kubernetes Installation

1. **Create a namespace**:
   ```bash
   kubectl create namespace zerotrustkerberos
   ```

2. **Create ConfigMap for configuration**:
   ```bash
   kubectl create configmap zerotrustkerberos-config \
     --from-file=/path/to/config.yaml \
     -n zerotrustkerberos
   ```

3. **Create Secrets for certificates and keytab**:
   ```bash
   kubectl create secret generic zerotrustkerberos-certs \
     --from-file=/path/to/server.pem \
     --from-file=/path/to/server-key.pem \
     -n zerotrustkerberos
   
   kubectl create secret generic zerotrustkerberos-keytab \
     --from-file=/path/to/service.keytab \
     -n zerotrustkerberos
   ```

4. **Create Deployment YAML**:
   ```bash
   cat > zerotrustkerberos-deployment.yaml << 'EOF'
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: zerotrustkerberos
     namespace: zerotrustkerberos
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: zerotrustkerberos
     template:
       metadata:
         labels:
           app: zerotrustkerberos
       spec:
         containers:
         - name: zerotrustkerberos
           image: zerotrustkerberos/kerberos-aws-proxy:latest
           ports:
           - containerPort: 8443
           volumeMounts:
           - name: config
             mountPath: /etc/zerotrustkerberos/config
           - name: certs
             mountPath: /etc/zerotrustkerberos/certs
             readOnly: true
           - name: keytab
             mountPath: /etc/zerotrustkerberos/keytab
             readOnly: true
           - name: logs
             mountPath: /var/log/zerotrustkerberos
           resources:
             requests:
               memory: "1Gi"
               cpu: "500m"
             limits:
               memory: "2Gi"
               cpu: "1000m"
           securityContext:
             readOnlyRootFilesystem: true
             runAsNonRoot: true
             runAsUser: 1000
             allowPrivilegeEscalation: false
             capabilities:
               drop:
               - ALL
         volumes:
         - name: config
           configMap:
             name: zerotrustkerberos-config
         - name: certs
           secret:
             secretName: zerotrustkerberos-certs
             defaultMode: 0600
         - name: keytab
           secret:
             secretName: zerotrustkerberos-keytab
             defaultMode: 0600
         - name: logs
           emptyDir: {}
   EOF
   ```

5. **Create Service YAML**:
   ```bash
   cat > zerotrustkerberos-service.yaml << 'EOF'
   apiVersion: v1
   kind: Service
   metadata:
     name: zerotrustkerberos
     namespace: zerotrustkerberos
   spec:
     selector:
       app: zerotrustkerberos
     ports:
     - port: 8443
       targetPort: 8443
     type: ClusterIP
   EOF
   ```

6. **Apply the Kubernetes manifests**:
   ```bash
   kubectl apply -f zerotrustkerberos-deployment.yaml
   kubectl apply -f zerotrustkerberos-service.yaml
   ```

### Manual Installation

1. **Install system dependencies**:
   ```bash
   # For Ubuntu/Debian
   apt-get update
   apt-get install -y python3 python3-pip python3-dev libkrb5-dev redis-server

   # For RHEL/CentOS
   dnf install -y python3 python3-pip python3-devel krb5-devel redis
   systemctl enable --now redis
   ```

2. **Install ZeroTrustKerberosLink**:
   ```bash
   pip3 install zerotrustkerberos
   ```

3. **Create configuration directories**:
   ```bash
   mkdir -p /etc/zerotrustkerberos/config
   mkdir -p /etc/zerotrustkerberos/certs
   mkdir -p /etc/zerotrustkerberos/keytab
   mkdir -p /var/log/zerotrustkerberos
   ```

4. **Create configuration file** (same as Docker example)

5. **Copy TLS certificates and Kerberos keytab** (same as Docker example)

6. **Create a systemd service**:
   ```bash
   cat > /etc/systemd/system/zerotrustkerberos.service << 'EOF'
   [Unit]
   Description=ZeroTrustKerberosLink Service
   After=network.target redis.service
   
   [Service]
   Type=simple
   User=zerotrustkerberos
   Group=zerotrustkerberos
   ExecStart=/usr/local/bin/zerotrustkerberos --config /etc/zerotrustkerberos/config/config.yaml
   Restart=on-failure
   RestartSec=5
   LimitNOFILE=65536
   
   # Security hardening
   CapabilityBoundingSet=
   PrivateTmp=true
   PrivateDevices=true
   ProtectHome=true
   ProtectSystem=full
   NoNewPrivileges=true
   
   [Install]
   WantedBy=multi-user.target
   EOF
   ```

7. **Create a dedicated user**:
   ```bash
   useradd -r -s /bin/false zerotrustkerberos
   chown -R zerotrustkerberos:zerotrustkerberos /etc/zerotrustkerberos
   chown -R zerotrustkerberos:zerotrustkerberos /var/log/zerotrustkerberos
   ```

8. **Start and enable the service**:
   ```bash
   systemctl daemon-reload
   systemctl enable --now zerotrustkerberos
   ```

## Security Hardening

After installation, implement these security hardening measures:

### TLS Configuration

Ensure strong TLS configuration:

```yaml
server:
  tls:
    enabled: true
    cert_file: "/etc/zerotrustkerberos/certs/server.pem"
    key_file: "/etc/zerotrustkerberos/certs/server-key.pem"
    min_version: "TLS1.2"
    ciphers:
      - "TLS_AES_256_GCM_SHA384"
      - "TLS_CHACHA20_POLY1305_SHA256"
      - "TLS_AES_128_GCM_SHA256"
    prefer_server_ciphers: true
```

### Security Headers

Enable security headers:

```yaml
security:
  headers:
    enabled: true
    content_security_policy: "default-src 'self'"
    xss_protection: true
    content_type_options: true
    frame_options: "DENY"
    hsts:
      enabled: true
      max_age: 31536000
      include_subdomains: true
      preload: true
    permissions_policy: "camera=(), microphone=(), geolocation=()"
```

### Input Validation

Configure comprehensive input validation:

```yaml
security:
  input_validation:
    enabled: true
    sanitize_html: true
    allowed_content_types:
      - "application/json"
      - "application/x-www-form-urlencoded"
    max_request_size: "1MB"
    validation_rules:
      - field: "username"
        pattern: "^[a-zA-Z0-9@._-]+$"
        max_length: 64
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```yaml
security:
  rate_limiting:
    enabled: true
    default_limit: 60
    auth_limit: 10
    ip_header: "X-Forwarded-For"
    response_code: 429
```

### Secure Redis Communication

Configure secure Redis communication:

```yaml
redis:
  host: "localhost"
  port: 6379
  tls:
    enabled: true
    cert_file: "/etc/zerotrustkerberos/certs/redis-cert.pem"
    key_file: "/etc/zerotrustkerberos/certs/redis-key.pem"
    ca_file: "/etc/zerotrustkerberos/certs/ca.pem"
    verify_hostname: true
  password_env: "REDIS_PASSWORD"
  connection_pool:
    max_connections: 10
    min_idle: 2
```

## Post-Installation Verification

After installation, verify that ZeroTrustKerberosLink is functioning correctly:

1. **Check service status**:
   ```bash
   # For systemd installation
   systemctl status zerotrustkerberos
   
   # For Docker installation
   docker ps | grep zerotrustkerberos
   
   # For Kubernetes installation
   kubectl get pods -n zerotrustkerberos
   ```

2. **Verify TLS configuration**:
   ```bash
   openssl s_client -connect localhost:8443 -tls1_2
   ```

3. **Test Kerberos authentication**:
   ```bash
   # Get a Kerberos ticket
   kinit user@EXAMPLE.COM
   
   # Test authentication
   curl -k --negotiate -u : https://zerotrustkerberos.example.com:8443/auth/kerberos
   ```

4. **Verify AWS role assumption**:
   ```bash
   # Test role assumption
   curl -k --negotiate -u : https://zerotrustkerberos.example.com:8443/aws/credentials
   ```

5. **Check security headers**:
   ```bash
   curl -k -I https://zerotrustkerberos.example.com:8443/health
   ```

## Security Testing

After installation, perform security testing:

```bash
# Run built-in security tests
zerotrustkerberos security test --comprehensive

# Validate configuration security
zerotrustkerberos security validate-config --config /etc/zerotrustkerberos/config/config.yaml

# Test TLS configuration
zerotrustkerberos security test-tls --endpoint https://zerotrustkerberos.example.com:8443
```

## Troubleshooting

Common installation issues:

| Issue | Possible Causes | Resolution |
|-------|-----------------|------------|
| Service fails to start | Incorrect configuration, missing dependencies | Check logs, verify configuration, install dependencies |
| TLS errors | Invalid certificates, incorrect paths | Verify certificate paths and permissions |
| Kerberos authentication failure | Invalid keytab, incorrect service principal | Verify keytab with `klist -kt`, check service principal configuration |
| Redis connection errors | Redis not running, incorrect configuration | Verify Redis is running, check connection settings |
| Permission errors | Incorrect file permissions | Check file ownership and permissions |

## Next Steps

After successful installation, proceed to:

1. [Configure AWS Integration](./aws-integration.md)
2. [Set Up High Availability](./high-availability.md)
3. [Configure Monitoring](./monitoring.md)
4. [Implement Audit Logging](./audit-logging.md)
5. [Verify Compliance](./compliance-verification.md)

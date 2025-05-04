# Healthcare Deployment Guide

This comprehensive guide provides step-by-step instructions for deploying ZeroTrustKerberosLink in healthcare environments with HIPAA compliance requirements.

## Table of Contents
- [Overview](#overview)
- [HIPAA Compliance Requirements](#hipaa-compliance-requirements)
- [Architecture Diagram](#architecture-diagram)
- [Prerequisites](#prerequisites)
- [Deployment Steps](#deployment-steps)
- [Configuration Templates](#configuration-templates)
- [Security Hardening](#security-hardening)
- [Compliance Verification](#compliance-verification)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Troubleshooting](#troubleshooting)
- [Deployment Checklist](#deployment-checklist)

## Overview

Healthcare organizations must maintain strict HIPAA compliance when integrating Kerberos authentication with AWS services. This deployment guide provides a secure, compliant implementation that protects electronic Protected Health Information (ePHI) while enabling secure AWS access.

**Key Benefits:**
- End-to-end encryption for all authentication traffic
- Comprehensive audit logging for HIPAA compliance
- PHI access tracking and monitoring
- Automated key rotation and credential management
- High-availability configuration with 99.99% uptime SLA

## HIPAA Compliance Requirements

This deployment architecture addresses the following HIPAA requirements:

| HIPAA Rule | Key Controls | Implementation Details |
|-----------|-------------|------------------------|
| Access Control (§164.312(a)(1)) | Unique user identification, emergency access, automatic logoff | Kerberos principals, emergency access procedures, session timeouts |
| Audit Controls (§164.312(b)) | Record and examine activity | Comprehensive audit logging, access tracking |
| Integrity (§164.312(c)(1)) | Prevent improper alteration or destruction | Cryptographic verification, integrity monitoring |
| Person or Entity Authentication (§164.312(d)) | Verify identity | Multi-factor authentication, certificate validation |
| Transmission Security (§164.312(e)(1)) | Prevent unauthorized access during transmission | TLS 1.3 encryption, secure channels |

## Architecture Diagram

The healthcare deployment uses a high-availability architecture with active-passive configuration across multiple availability zones:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   Healthcare Organization                       │
│                                                                 │
│  ┌──────────────┐        ┌───────────────┐                      │
│  │              │        │               │                      │
│  │   Kerberos   │◄──────►│  ZTK Primary  │                      │
│  │     KDC      │        │     Node      │                      │
│  │              │        │               │                      │
│  └──────────────┘        └───────┬───────┘                      │
│                                  │                              │
│                                  │                              │
│  ┌──────────────┐        ┌───────▼───────┐                      │
│  │              │        │               │                      │
│  │  MFA Server  │◄──────►│  ZTK Standby  │                      │
│  │              │        │     Node      │                      │
│  │              │        │               │                      │
│  └──────────────┘        └───────┬───────┘                      │
│                                  │                              │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
                                   │  Secure VPN/Direct Connect
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        AWS Cloud                                │
│                                                                 │
│  ┌──────────────┐        ┌───────────────┐      ┌────────────┐  │
│  │              │        │               │      │            │  │
│  │  IAM Roles   │◄──────►│  AWS STS      │◄────►│  AWS KMS   │  │
│  │              │        │               │      │            │  │
│  └──────────────┘        └───────────────┘      └────────────┘  │
│                                                                 │
│                                                                 │
│  ┌──────────────┐        ┌───────────────┐      ┌────────────┐  │
│  │              │        │               │      │            │  │
│  │ CloudWatch   │◄──────►│ CloudTrail    │◄────►│ S3 Logs    │  │
│  │              │        │               │      │            │  │
│  └──────────────┘        └───────────────┘      └────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before deploying ZeroTrustKerberosLink in a healthcare environment, ensure you have:

- **Infrastructure Requirements:**
  - Two or more dedicated servers for high availability (8+ CPU cores, 16+ GB RAM)
  - Network connectivity between Kerberos KDC and AWS (via Direct Connect or VPN)
  - Hardware Security Module (HSM) for key management (recommended)

- **AWS Account Configuration:**
  - IAM permissions to create roles and policies
  - AWS CloudTrail enabled with log validation
  - AWS KMS configured for encryption with HIPAA-eligible keys
  - AWS Config for compliance monitoring

- **Kerberos Environment:**
  - Active Directory or MIT Kerberos KDC
  - Service principal for ZeroTrustKerberosLink
  - Administrative access to create and manage Kerberos principals

## Deployment Steps

### Step 1: Prepare the Environment

1. **Set up dedicated servers:**
   ```bash
   # Install required packages
   sudo apt update
   sudo apt install -y docker.io docker-compose python3 python3-pip

   # Enable and start Docker
   sudo systemctl enable docker
   sudo systemctl start docker

   # Add current user to docker group
   sudo usermod -aG docker $USER
   ```

2. **Configure network security:**
   ```bash
   # Configure firewall rules
   sudo ufw allow from [KDC_IP] to any port 88,464,749
   sudo ufw allow from [AWS_VPN_CIDR] to any port 443,8443
   sudo ufw enable
   ```

3. **Set up AWS CLI:**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configure AWS credentials
   aws configure
   ```

### Step 2: Install ZeroTrustKerberosLink

1. **Download the installation package:**
   ```bash
   curl -O https://zerotrustkerberoslink.com/downloads/ztk-installer.tar.gz
   tar -xzvf ztk-installer.tar.gz
   cd ztk-installer
   ```

2. **Run the installation script:**
   ```bash
   sudo ./install.sh --ha-mode=active-passive --nodes=2
   ```

3. **Verify installation:**
   ```bash
   sudo systemctl status ztk-service
   ```

### Step 3: Configure for Healthcare

1. **Generate configuration file:**
   ```bash
   sudo ztk-config --generate-template=healthcare > /etc/ztk/config.yaml
   ```

2. **Edit the configuration file:**
   ```bash
   sudo nano /etc/ztk/config.yaml
   ```

3. **Apply the configuration:**
   ```bash
   sudo ztk-config --apply /etc/ztk/config.yaml
   ```

### Step 4: Integrate with AWS

1. **Create IAM roles and policies:**
   ```bash
   aws iam create-role --role-name ZTKServiceRole --assume-role-policy-document file://ztk-trust-policy.json
   aws iam attach-role-policy --role-name ZTKServiceRole --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
   ```

2. **Configure AWS integration:**
   ```bash
   sudo ztk-aws-config --role-arn=arn:aws:iam::123456789012:role/ZTKServiceRole --region=us-east-1
   ```

3. **Test AWS integration:**
   ```bash
   sudo ztk-test aws-integration
   ```

### Step 5: HIPAA Security Configuration

1. **Enable encryption:**
   ```bash
   sudo ztk-security --enable-encryption --key-rotation=7d --fips-mode=enabled
   ```

2. **Configure audit logging:**
   ```bash
   sudo ztk-logging --level=verbose --retention=6y --phi-access-tracking=enabled
   ```

3. **Set up MFA integration:**
   ```bash
   sudo ztk-security --enable-mfa --mfa-provider=duo
   ```

## Configuration Templates

### HIPAA Compliant Configuration

```yaml
# ZeroTrustKerberosLink Healthcare Configuration
# HIPAA Compliant

# High Availability Settings
ha_mode: active-passive
min_nodes: 2
failover_timeout: 30s

# Kerberos Settings
kerberos:
  realm: HEALTHCARE.EXAMPLE.COM
  kdc_servers:
    - kdc1.healthcare.example.com
    - kdc2.healthcare.example.com
  service_principal: ztk/service@HEALTHCARE.EXAMPLE.COM
  keytab_path: /etc/ztk/service.keytab
  ticket_lifetime: 8h
  renewable_lifetime: 24h

# AWS Integration
aws:
  region: us-east-1
  role_mappings:
    - kerberos_principal: "admin@HEALTHCARE.EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/AdminRole"
      mfa_required: true
    - kerberos_principal: "physician@HEALTHCARE.EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/PhysicianRole"
      mfa_required: true
    - kerberos_principal: "auditor@HEALTHCARE.EXAMPLE.COM"
      aws_role: "arn:aws:iam::123456789012:role/AuditorRole"
      mfa_required: true
  session_duration: 3600
  credential_rotation: enabled

# Security Settings
security:
  encryption:
    transit: tls1.3_fips
    at_rest: aes256_fips
    key_rotation: 7d
  authentication:
    mfa_enabled: true
    mfa_provider: duo
    failed_login_lockout: 5
    password_policy: strong
  session:
    idle_timeout: 10m
    max_duration: 8h
    concurrent_sessions: 1

# Audit Logging
logging:
  level: verbose
  destinations:
    - local
    - syslog
    - cloudwatch
  retention: 6y
  phi_access_tracking: enabled
  sensitive_fields_masking: enabled

# Compliance
compliance:
  hipaa_mode: enabled
  phi_access_logging: enabled
  audit_logging: verbose
  log_retention: 6y
  emergency_access_procedure: enabled
```

## Security Hardening

Healthcare deployments require additional security hardening:

1. **Encryption Requirements:**
   - TLS 1.3 with FIPS 140-2 validated modules
   - AES-256 for data at rest
   - FIPS 140-2 validated cryptographic modules
   - Automatic key rotation every 7 days

2. **Authentication Controls:**
   - Multi-factor authentication for all administrative access
   - Certificate-based authentication for service accounts
   - Maximum 10-minute session timeouts
   - Automatic account lockout after 5 failed attempts

3. **Network Security:**
   - Dedicated security groups and NACLs
   - Private subnets with no direct internet access
   - VPC endpoints for AWS services
   - Web Application Firewall for API endpoints

## Compliance Verification

After deployment, verify HIPAA compliance with:

1. **Automated Compliance Checks:**
   ```bash
   sudo ztk-compliance --check=hipaa
   ```

2. **Generate Compliance Reports:**
   ```bash
   sudo ztk-report --compliance=hipaa --output=pdf
   ```

3. **Validate Audit Logging:**
   ```bash
   sudo ztk-logs --validate --framework=hipaa
   ```

## Monitoring and Alerting

Set up comprehensive monitoring for your healthcare deployment:

1. **CloudWatch Alarms:**
   - Authentication failures
   - Service availability
   - PHI access patterns
   - Configuration changes

2. **Security Incident Detection:**
   - Unusual access patterns
   - Privilege escalation attempts
   - Cross-region access
   - After-hours activity

3. **Compliance Monitoring:**
   - Configuration drift detection
   - Continuous compliance validation
   - Automated remediation workflows

## Troubleshooting

### Common Issues in Healthcare Deployments

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| Kerberos Authentication Failures | "Ticket expired" or "Cannot find key" errors | Check time synchronization between KDC and ZTK servers; verify keytab file permissions |
| AWS Role Access Denied | "AccessDenied" when attempting to assume role | Verify trust relationship in IAM role; check principal names in configuration |
| MFA Integration Issues | MFA prompts not appearing or failing | Verify MFA provider configuration; check network connectivity to MFA service |
| PHI Access Logging Failures | Missing PHI access entries in logs | Verify PHI tracking configuration; check log destinations |
| FIPS Mode Issues | Cryptographic errors or service failures | Verify FIPS-validated libraries are installed; check FIPS mode configuration |

### Diagnostic Commands

```bash
# Check service status
sudo systemctl status ztk-service

# View logs
sudo journalctl -u ztk-service -f

# Test Kerberos connectivity
sudo ztk-test kerberos-connectivity

# Verify AWS integration
sudo ztk-test aws-integration

# Run HIPAA compliance diagnostics
sudo ztk-diagnostics --hipaa-check
```

## Deployment Checklist

Use this checklist to ensure your healthcare deployment meets all HIPAA requirements:

- [ ] **Pre-Deployment**
  - [ ] Network connectivity verified
  - [ ] Firewall rules configured
  - [ ] Server hardening completed
  - [ ] AWS IAM roles created
  - [ ] Kerberos principals and keytabs generated

- [ ] **Installation**
  - [ ] ZeroTrustKerberosLink installed on all nodes
  - [ ] High availability configured
  - [ ] Configuration files customized
  - [ ] Services started and verified

- [ ] **Security Configuration**
  - [ ] FIPS-compliant encryption enabled
  - [ ] MFA integration configured
  - [ ] PHI access tracking enabled
  - [ ] Key rotation scheduled
  - [ ] Session timeouts configured

- [ ] **Compliance Verification**
  - [ ] HIPAA compliance verified
  - [ ] PHI access logging validated
  - [ ] Emergency access procedures tested
  - [ ] Compliance reports generated

- [ ] **Monitoring and Alerting**
  - [ ] CloudWatch alarms configured
  - [ ] Log forwarding set up
  - [ ] Security incident detection enabled
  - [ ] Status dashboard created

- [ ] **Documentation**
  - [ ] Architecture diagram updated
  - [ ] Configuration documented
  - [ ] Runbooks created
  - [ ] Recovery procedures documented
  - [ ] Business Associate Agreement (BAA) in place

# Government Deployment Guide

This comprehensive guide provides step-by-step instructions for deploying ZeroTrustKerberosLink in government environments with FedRAMP compliance requirements.

## Table of Contents
- [Overview](#overview)
- [FedRAMP Compliance Requirements](#fedramp-compliance-requirements)
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

Government agencies require the highest levels of security and compliance when integrating Kerberos authentication with AWS services. This deployment guide provides a secure, FedRAMP-compliant implementation that meets federal security requirements.

**Key Benefits:**
- End-to-end encryption with FIPS 140-2 validated modules
- Comprehensive audit logging for FedRAMP compliance
- Support for PIV/CAC card authentication
- Automated key rotation and credential management
- High-availability configuration with 99.99% uptime SLA

## FedRAMP Compliance Requirements

This deployment architecture addresses the following FedRAMP requirements:

| FedRAMP Control Family | Key Controls | Implementation Details |
|-----------|-------------|------------------------|
| Access Control (AC) | AC-2, AC-3, AC-4, AC-17 | Role-based access control, least privilege, information flow enforcement |
| Audit and Accountability (AU) | AU-2, AU-3, AU-6, AU-9 | Comprehensive audit logging, log protection, log review |
| Identification and Authentication (IA) | IA-2, IA-5, IA-8 | Multi-factor authentication, credential management, PIV/CAC integration |
| System and Communications Protection (SC) | SC-8, SC-12, SC-13 | Transmission confidentiality, cryptographic key management, FIPS-validated cryptography |

## Architecture Diagram

The government deployment uses a high-availability architecture with active-active configuration across multiple availability zones:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     Government Agency                           │
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
│  │  PIV/CAC     │◄──────►│  ZTK Replica  │                      │
│  │  System      │        │     Node      │                      │
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
│                   AWS GovCloud (US)                             │
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

Before deploying ZeroTrustKerberosLink in a government environment, ensure you have:

- **Infrastructure Requirements:**
  - Two or more dedicated servers for high availability (8+ CPU cores, 16+ GB RAM)
  - Network connectivity between Kerberos KDC and AWS GovCloud (via Direct Connect or VPN)
  - Hardware Security Module (HSM) for key management (required)

- **AWS GovCloud Account Configuration:**
  - IAM permissions to create roles and policies
  - AWS CloudTrail enabled with log validation
  - AWS KMS configured with FIPS-compliant keys
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

   # Configure AWS credentials for GovCloud
   aws configure --profile govcloud
   ```

### Step 2: Install ZeroTrustKerberosLink

1. **Download the installation package:**
   ```bash
   curl -O https://zerotrustkerberoslink.com/downloads/ztk-installer-fips.tar.gz
   tar -xzvf ztk-installer-fips.tar.gz
   cd ztk-installer-fips
   ```

2. **Run the installation script:**
   ```bash
   sudo ./install.sh --ha-mode=active-active --nodes=2 --fips-mode=enabled
   ```

3. **Verify installation:**
   ```bash
   sudo systemctl status ztk-service
   ```

### Step 3: Configure for Government

1. **Generate configuration file:**
   ```bash
   sudo ztk-config --generate-template=government > /etc/ztk/config.yaml
   ```

2. **Edit the configuration file:**
   ```bash
   sudo nano /etc/ztk/config.yaml
   ```

3. **Apply the configuration:**
   ```bash
   sudo ztk-config --apply /etc/ztk/config.yaml
   ```

### Step 4: Integrate with AWS GovCloud

1. **Create IAM roles and policies:**
   ```bash
   aws iam create-role --role-name ZTKServiceRole --assume-role-policy-document file://ztk-trust-policy.json --profile govcloud
   aws iam attach-role-policy --role-name ZTKServiceRole --policy-arn arn:aws-us-gov:iam::aws:policy/ReadOnlyAccess --profile govcloud
   ```

2. **Configure AWS integration:**
   ```bash
   sudo ztk-aws-config --role-arn=arn:aws-us-gov:iam::123456789012:role/ZTKServiceRole --region=us-gov-west-1 --govcloud=true
   ```

3. **Test AWS integration:**
   ```bash
   sudo ztk-test aws-integration --govcloud
   ```

### Step 5: FedRAMP Security Configuration

1. **Enable FIPS-compliant encryption:**
   ```bash
   sudo ztk-security --enable-encryption --key-rotation=7d --fips-mode=enabled
   ```

2. **Configure audit logging:**
   ```bash
   sudo ztk-logging --level=verbose --retention=7y --fedramp-controls=enabled
   ```

3. **Set up PIV/CAC integration:**
   ```bash
   sudo ztk-security --enable-piv-cac --certificate-validation=ocsp
   ```

## Configuration Templates

### FedRAMP High Compliant Configuration

```yaml
# ZeroTrustKerberosLink Government Configuration
# FedRAMP High Compliant

# High Availability Settings
ha_mode: active-active
min_nodes: 2
failover_timeout: 30s

# Kerberos Settings
kerberos:
  realm: GOV.EXAMPLE.GOV
  kdc_servers:
    - kdc1.gov.example.gov
    - kdc2.gov.example.gov
  service_principal: ztk/service@GOV.EXAMPLE.GOV
  keytab_path: /etc/ztk/service.keytab
  ticket_lifetime: 8h
  renewable_lifetime: 24h

# AWS Integration
aws:
  region: us-gov-west-1
  govcloud: true
  role_mappings:
    - kerberos_principal: "admin@GOV.EXAMPLE.GOV"
      aws_role: "arn:aws-us-gov:iam::123456789012:role/AdminRole"
      mfa_required: true
    - kerberos_principal: "analyst@GOV.EXAMPLE.GOV"
      aws_role: "arn:aws-us-gov:iam::123456789012:role/AnalystRole"
      mfa_required: true
    - kerberos_principal: "auditor@GOV.EXAMPLE.GOV"
      aws_role: "arn:aws-us-gov:iam::123456789012:role/AuditorRole"
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
    piv_cac_enabled: true
    certificate_validation: ocsp
    failed_login_lockout: 3
    password_policy: strong
  session:
    idle_timeout: 15m
    max_duration: 8h
    concurrent_sessions: 1

# Audit Logging
logging:
  level: verbose
  destinations:
    - local
    - syslog
    - cloudwatch
  retention: 7y
  sensitive_fields_masking: enabled

# Compliance
compliance:
  fedramp_high_mode: enabled
  nist_800_53_controls: enabled
  audit_logging: verbose
  log_retention: 7y
```

## Security Hardening

Government deployments require additional security hardening:

1. **Encryption Requirements:**
   - TLS 1.3 with FIPS 140-2 validated modules
   - AES-256 for data at rest
   - FIPS 140-2 validated cryptographic modules
   - Automatic key rotation every 7 days

2. **Authentication Controls:**
   - PIV/CAC card integration
   - Certificate-based authentication
   - Maximum 15-minute session timeouts
   - Automatic account lockout after 3 failed attempts

3. **Network Security:**
   - Dedicated security groups and NACLs
   - Private subnets with no direct internet access
   - VPC endpoints for AWS services
   - Web Application Firewall for API endpoints

## Compliance Verification

After deployment, verify FedRAMP compliance with:

1. **Automated Compliance Checks:**
   ```bash
   sudo ztk-compliance --check=fedramp-high
   sudo ztk-compliance --check=nist-800-53
   ```

2. **Generate Compliance Reports:**
   ```bash
   sudo ztk-report --compliance=fedramp-high --output=pdf
   ```

3. **Validate Audit Logging:**
   ```bash
   sudo ztk-logs --validate --framework=fedramp
   ```

## Monitoring and Alerting

Set up comprehensive monitoring for your government deployment:

1. **CloudWatch Alarms:**
   - Authentication failures
   - Service availability
   - Certificate validation failures
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

### Common Issues in Government Deployments

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| Kerberos Authentication Failures | "Ticket expired" or "Cannot find key" errors | Check time synchronization between KDC and ZTK servers; verify keytab file permissions |
| AWS Role Access Denied | "AccessDenied" when attempting to assume role | Verify trust relationship in IAM role; check principal names in configuration |
| PIV/CAC Integration Issues | Certificate validation failures | Verify OCSP responder availability; check certificate chain; validate PIV/CAC configuration |
| FIPS Mode Issues | Cryptographic errors or service failures | Verify FIPS-validated libraries are installed; check FIPS mode configuration |
| GovCloud Connectivity | Connection timeouts to AWS services | Verify VPN/Direct Connect to GovCloud; check network routing; validate AWS GovCloud endpoints |

### Diagnostic Commands

```bash
# Check service status
sudo systemctl status ztk-service

# View logs
sudo journalctl -u ztk-service -f

# Test Kerberos connectivity
sudo ztk-test kerberos-connectivity

# Verify AWS GovCloud integration
sudo ztk-test aws-integration --govcloud

# Run FedRAMP compliance diagnostics
sudo ztk-diagnostics --fedramp-check
```

## Deployment Checklist

Use this checklist to ensure your government deployment meets all FedRAMP requirements:

- [ ] **Pre-Deployment**
  - [ ] Network connectivity verified
  - [ ] Firewall rules configured
  - [ ] Server hardening completed
  - [ ] AWS IAM roles created in GovCloud
  - [ ] Kerberos principals and keytabs generated

- [ ] **Installation**
  - [ ] ZeroTrustKerberosLink installed on all nodes with FIPS mode
  - [ ] High availability configured
  - [ ] Configuration files customized
  - [ ] Services started and verified

- [ ] **Security Configuration**
  - [ ] FIPS-compliant encryption enabled
  - [ ] PIV/CAC integration configured
  - [ ] Certificate validation enabled
  - [ ] Key rotation scheduled
  - [ ] Session timeouts configured

- [ ] **Compliance Verification**
  - [ ] FedRAMP High compliance verified
  - [ ] NIST 800-53 controls implemented
  - [ ] Audit logging validated
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
  - [ ] System Security Plan (SSP) updated

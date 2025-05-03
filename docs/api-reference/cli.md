# Command Line Interface (CLI)

The ZeroTrustKerberosLink CLI provides a powerful command-line interface for interacting with the service. It enables administrators and users to authenticate, manage roles, and obtain AWS credentials directly from the terminal.

## Installation

### Using pip (Recommended)

```bash
pip install zerotrust-kerberos-cli
```

### Using Homebrew (macOS)

```bash
brew install zerotrust-kerberos-cli
```

### Manual Installation

Download the appropriate binary for your platform from the [releases page](https://github.com/zerotrustkerberos/cli/releases) and add it to your PATH.

## Configuration

The CLI can be configured using a configuration file or environment variables.

### Configuration File

Create a configuration file at `~/.zerotrust/config.yaml`:

```yaml
# Server configuration
server:
  url: https://your-zerotrustkerberos-deployment.example.com
  verify_ssl: true

# Authentication settings
auth:
  kerberos:
    principal: user@EXAMPLE.COM
    keytab: ~/.zerotrust/user.keytab
  
# AWS settings
aws:
  default_role: arn:aws:iam::123456789012:role/Developer
  credential_cache: ~/.aws/zerotrust-credentials
  region: us-west-2
  
# Security settings
security:
  session_duration: 3600
  cache_credentials: true
  encrypt_cache: true
```

### Environment Variables

Alternatively, you can use environment variables:

```bash
# Server configuration
export ZEROTRUST_SERVER_URL=https://your-zerotrustkerberos-deployment.example.com
export ZEROTRUST_VERIFY_SSL=true

# Authentication settings
export ZEROTRUST_KERBEROS_PRINCIPAL=user@EXAMPLE.COM
export ZEROTRUST_KERBEROS_KEYTAB=~/.zerotrust/user.keytab

# AWS settings
export ZEROTRUST_AWS_DEFAULT_ROLE=arn:aws:iam::123456789012:role/Developer
export ZEROTRUST_AWS_CREDENTIAL_CACHE=~/.aws/zerotrust-credentials
export ZEROTRUST_AWS_REGION=us-west-2

# Security settings
export ZEROTRUST_SESSION_DURATION=3600
export ZEROTRUST_CACHE_CREDENTIALS=true
export ZEROTRUST_ENCRYPT_CACHE=true
```

## Command Reference

### Global Options

These options can be used with any command:

```
--config FILE       Path to configuration file
--server-url URL    ZeroTrustKerberosLink server URL
--verbose           Enable verbose output
--debug             Enable debug output
--help              Show help message and exit
--version           Show version information
```

### Authentication Commands

#### Login

Authenticate with Kerberos and obtain a session token:

```bash
zerotrust login
```

Options:
```
--principal NAME    Kerberos principal name
--keytab FILE       Path to Kerberos keytab file
--password          Prompt for password instead of using keytab
--duration SECONDS  Session duration in seconds (default: 3600)
```

#### Logout

Invalidate the current session:

```bash
zerotrust logout
```

#### Status

Check the current authentication status:

```bash
zerotrust status
```

### Role Management Commands

#### List Roles

List available AWS IAM roles:

```bash
zerotrust roles list
```

Options:
```
--account ID        Filter roles by AWS account ID
--name NAME         Filter roles by name
--format FORMAT     Output format (json, yaml, table) (default: table)
```

#### Describe Role

Show detailed information about a role:

```bash
zerotrust roles describe ROLE_ARN
```

Options:
```
--format FORMAT     Output format (json, yaml, table) (default: table)
```

### Credential Commands

#### Assume Role

Assume an AWS IAM role and get temporary credentials:

```bash
zerotrust assume-role ROLE_ARN
```

Options:
```
--duration SECONDS  Credential duration in seconds (default: 3600)
--export            Print export commands for shell
--profile NAME      Save credentials to AWS profile
```

#### Export Credentials

Export AWS credentials to the current shell:

```bash
eval $(zerotrust export-credentials)
```

Options:
```
--role ROLE_ARN     Role to assume (default: from config)
--duration SECONDS  Credential duration in seconds (default: 3600)
```

### Session Commands

#### Session Info

Display information about the current session:

```bash
zerotrust session info
```

Options:
```
--format FORMAT     Output format (json, yaml, table) (default: table)
```

### Configuration Commands

#### Configure

Interactive configuration wizard:

```bash
zerotrust configure
```

#### View Config

View current configuration:

```bash
zerotrust config view
```

Options:
```
--format FORMAT     Output format (json, yaml, table) (default: yaml)
```

## Examples

### Basic Authentication and Role Assumption

```bash
# Authenticate with Kerberos
zerotrust login

# List available roles
zerotrust roles list

# Assume a role and export credentials to shell
eval $(zerotrust export-credentials --role arn:aws:iam::123456789012:role/Developer)

# Verify credentials are working
aws sts get-caller-identity
```

### Saving Credentials to AWS Profile

```bash
# Assume a role and save credentials to AWS profile
zerotrust assume-role arn:aws:iam::123456789012:role/Developer --profile dev

# Use the profile with AWS CLI
aws --profile dev s3 ls
```

### Automation Script Example

```bash
#!/bin/bash
# Script to automate AWS access

# Authenticate with Kerberos
zerotrust login --principal user@EXAMPLE.COM --keytab ~/.zerotrust/user.keytab

# Assume role
zerotrust assume-role arn:aws:iam::123456789012:role/Developer --profile dev

# Run AWS commands
aws --profile dev ec2 describe-instances
```

## Security Features

The CLI implements several security features:

1. **Secure Storage**: Session tokens and credentials are stored securely
2. **Encryption**: Cached credentials can be encrypted
3. **Automatic Renewal**: Session tokens are automatically renewed when needed
4. **Secure Communication**: All communication with the server uses TLS
5. **Input Validation**: All user input is validated to prevent injection attacks

## Troubleshooting

### Common Issues

#### Authentication Failures

If authentication fails, check:
- Kerberos ticket validity (`klist`)
- Keytab file permissions
- Server URL configuration

#### Connection Issues

If you can't connect to the server:
- Verify the server URL
- Check network connectivity
- Ensure TLS certificates are valid

#### Permission Errors

If you get permission errors when assuming a role:
- Verify your Kerberos principal has the necessary permissions
- Check the role mapping configuration on the server

### Logging

Enable debug logging for more information:

```bash
zerotrust --debug login
```

Logs are written to `~/.zerotrust/logs/cli.log` by default.

## Advanced Usage

### Using with AWS SDKs

The CLI can be used to provide credentials to AWS SDKs:

```python
# Python example
import boto3

# Configure boto3 to use the ZeroTrustKerberosLink profile
session = boto3.Session(profile_name='zerotrust')
s3 = session.client('s3')
```

### Integration with Other Tools

The CLI can be integrated with other tools that support AWS credentials:

```bash
# Terraform example
export AWS_PROFILE=zerotrust
terraform plan
```

## Version History

- **v1.0.0**: Initial release
- **v1.1.0**: Added support for credential caching
- **v1.2.0**: Added support for multiple AWS accounts
- **v1.3.0**: Added support for role filtering
- **v2.0.0**: Complete rewrite with improved security features

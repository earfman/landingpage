# API Reference

This section provides comprehensive documentation for the ZeroTrustKerberosLink API, including the REST API, command-line interface (CLI), and software development kit (SDK).

## REST API

ZeroTrustKerberosLink provides a RESTful API that allows you to integrate with your existing systems and automate workflows.

### Authentication Endpoints

| Endpoint | Method | Description | Security Level |
|----------|--------|-------------|---------------|
| `/auth/kerberos` | POST | Authenticate using Kerberos credentials | <span class="security-level high">High</span> |
| `/auth/aws` | POST | Obtain AWS temporary credentials | <span class="security-level high">High</span> |
| `/auth/refresh` | POST | Refresh existing credentials | <span class="security-level high">High</span> |
| `/auth/revoke` | POST | Revoke active credentials | <span class="security-level high">High</span> |

### Configuration Endpoints

| Endpoint | Method | Description | Security Level |
|----------|--------|-------------|---------------|
| `/config/roles` | GET | List role mappings | <span class="security-level medium">Medium</span> |
| `/config/roles` | POST | Create role mapping | <span class="security-level high">High</span> |
| `/config/roles/{id}` | PUT | Update role mapping | <span class="security-level high">High</span> |
| `/config/roles/{id}` | DELETE | Delete role mapping | <span class="security-level high">High</span> |

### Monitoring Endpoints

| Endpoint | Method | Description | Security Level |
|----------|--------|-------------|---------------|
| `/health` | GET | Check service health | <span class="security-level low">Low</span> |
| `/metrics` | GET | Get service metrics | <span class="security-level medium">Medium</span> |
| `/logs` | GET | Get service logs | <span class="security-level high">High</span> |

## Command-Line Interface (CLI)

ZeroTrustKerberosLink provides a powerful CLI for administration and automation.

### Installation

```bash
pip install zerotrustkerberos-cli
```

### Authentication Commands

```bash
# Authenticate and get AWS credentials
zerotrustkerberos auth aws --profile my-profile

# Refresh credentials
zerotrustkerberos auth refresh --profile my-profile

# Revoke credentials
zerotrustkerberos auth revoke --profile my-profile
```

### Configuration Commands

```bash
# List role mappings
zerotrustkerberos config roles list

# Create role mapping
zerotrustkerberos config roles create --principal "user@EXAMPLE.COM" --role "arn:aws:iam::123456789012:role/UserRole"

# Update role mapping
zerotrustkerberos config roles update --id 123 --conditions '{"ip_ranges": ["10.0.0.0/8"]}'

# Delete role mapping
zerotrustkerberos config roles delete --id 123
```

### Security Commands

```bash
# Run security tests
zerotrustkerberos security test --comprehensive

# Validate configuration security
zerotrustkerberos security validate-config --config /etc/zerotrustkerberos/config.yaml

# Generate security report
zerotrustkerberos security report --output security-report.pdf
```

## Software Development Kit (SDK)

ZeroTrustKerberosLink provides SDKs for various programming languages to integrate with your applications.

### Python SDK

```python
from zerotrustkerberos import ZeroTrustKerberosClient

# Initialize client
client = ZeroTrustKerberosClient()

# Authenticate and get AWS credentials
credentials = client.authenticate()

# Use credentials with boto3
import boto3
session = boto3.Session(
    aws_access_key_id=credentials['AccessKeyId'],
    aws_secret_access_key=credentials['SecretAccessKey'],
    aws_session_token=credentials['SessionToken']
)

# Use the session
s3 = session.client('s3')
response = s3.list_buckets()
```

### JavaScript SDK

```javascript
import { ZeroTrustKerberosClient } from 'zerotrustkerberos';

// Initialize client
const client = new ZeroTrustKerberosClient();

// Authenticate and get AWS credentials
async function getCredentials() {
  try {
    const credentials = await client.authenticate();
    
    // Use credentials with AWS SDK
    const AWS = require('aws-sdk');
    AWS.config.credentials = new AWS.Credentials({
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken
    });
    
    // Use AWS services
    const s3 = new AWS.S3();
    const response = await s3.listBuckets().promise();
    console.log(response.Buckets);
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}

getCredentials();
```

## Security Considerations

When using the ZeroTrustKerberosLink API, follow these security best practices:

<div class="security-feature">
  <h4>TLS Encryption</h4>
  <p>Always use HTTPS for all API communications. The API server will reject non-HTTPS connections.</p>
</div>

<div class="security-feature">
  <h4>Credential Handling</h4>
  <p>Never store AWS credentials in code or version control. Use secure credential storage appropriate for your environment.</p>
</div>

<div class="security-feature">
  <h4>Principle of Least Privilege</h4>
  <p>Configure role mappings with the minimum permissions necessary for your application to function.</p>
</div>

<div class="security-feature">
  <h4>Input Validation</h4>
  <p>Although the API performs comprehensive input validation, always validate inputs in your client applications as well.</p>
</div>

## Rate Limiting

The API implements rate limiting to protect against abuse and denial of service attacks:

- Authentication endpoints: 30 requests per minute per IP address
- Configuration endpoints: 60 requests per minute per IP address
- Monitoring endpoints: 120 requests per minute per IP address

Exceeding these limits will result in HTTP 429 (Too Many Requests) responses.

## Error Handling

The API returns standard HTTP status codes and JSON error responses:

```json
{
  "error": {
    "code": "authentication_failed",
    "message": "Kerberos authentication failed",
    "details": "Invalid credentials or expired ticket"
  },
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Always include the `request_id` when reporting issues to support.

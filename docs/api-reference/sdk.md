# SDK Reference

ZeroTrustKerberosLink provides Software Development Kits (SDKs) for multiple programming languages to simplify integration with your applications. These SDKs handle authentication, role management, and AWS credential retrieval.

## Available SDKs

The following SDKs are available:

- [Python SDK](#python-sdk)
- [Java SDK](#java-sdk)
- [JavaScript/TypeScript SDK](#javascripttypescript-sdk)
- [Go SDK](#go-sdk)
- [Ruby SDK](#ruby-sdk)

## Common Features

All SDKs provide the following core features:

- Kerberos authentication
- Session management
- AWS role listing and filtering
- AWS credential retrieval
- Automatic credential renewal
- Secure credential storage
- Error handling and logging

## Python SDK

### Installation

```bash
pip install zerotrust-kerberos-sdk
```

### Basic Usage

```python
from zerotrust_kerberos import ZeroTrustClient

# Initialize client
client = ZeroTrustClient(
    server_url="https://your-zerotrustkerberos-deployment.example.com",
    kerberos_principal="user@EXAMPLE.COM",
    kerberos_keytab="/path/to/keytab"
)

# Authenticate
client.authenticate()

# List available roles
roles = client.list_roles()
for role in roles:
    print(f"Role: {role.role_name}, ARN: {role.role_arn}")

# Assume a role
credentials = client.assume_role("arn:aws:iam::123456789012:role/Developer")

# Use credentials with boto3
import boto3
session = boto3.Session(
    aws_access_key_id=credentials.access_key_id,
    aws_secret_access_key=credentials.secret_access_key,
    aws_session_token=credentials.session_token
)
s3 = session.client('s3')
```

### Advanced Configuration

```python
from zerotrust_kerberos import ZeroTrustClient, SecurityConfig, LogLevel

# Configure security settings
security_config = SecurityConfig(
    verify_ssl=True,
    session_duration=3600,
    cache_credentials=True,
    encrypt_cache=True
)

# Initialize client with advanced configuration
client = ZeroTrustClient(
    server_url="https://your-zerotrustkerberos-deployment.example.com",
    kerberos_principal="user@EXAMPLE.COM",
    kerberos_keytab="/path/to/keytab",
    security_config=security_config,
    log_level=LogLevel.DEBUG
)
```

### Error Handling

```python
from zerotrust_kerberos import ZeroTrustClient, AuthenticationError, RoleAssumptionError

client = ZeroTrustClient(...)

try:
    client.authenticate()
    credentials = client.assume_role("arn:aws:iam::123456789012:role/Developer")
except AuthenticationError as e:
    print(f"Authentication failed: {e}")
except RoleAssumptionError as e:
    print(f"Role assumption failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
```

## Java SDK

### Installation

#### Maven

```xml
<dependency>
    <groupId>com.zerotrustkerberos</groupId>
    <artifactId>zerotrust-kerberos-sdk</artifactId>
    <version>2.0.0</version>
</dependency>
```

#### Gradle

```groovy
implementation 'com.zerotrustkerberos:zerotrust-kerberos-sdk:2.0.0'
```

### Basic Usage

```java
import com.zerotrustkerberos.ZeroTrustClient;
import com.zerotrustkerberos.model.Role;
import com.zerotrustkerberos.model.Credentials;

public class Example {
    public static void main(String[] args) {
        // Initialize client
        ZeroTrustClient client = ZeroTrustClient.builder()
            .serverUrl("https://your-zerotrustkerberos-deployment.example.com")
            .kerberosPrincipal("user@EXAMPLE.COM")
            .kerberosKeytab("/path/to/keytab")
            .build();
        
        // Authenticate
        client.authenticate();
        
        // List available roles
        List<Role> roles = client.listRoles();
        for (Role role : roles) {
            System.out.println("Role: " + role.getRoleName() + ", ARN: " + role.getRoleArn());
        }
        
        // Assume a role
        Credentials credentials = client.assumeRole("arn:aws:iam::123456789012:role/Developer");
        
        // Use credentials with AWS SDK
        AWSCredentials awsCredentials = new BasicSessionCredentials(
            credentials.getAccessKeyId(),
            credentials.getSecretAccessKey(),
            credentials.getSessionToken()
        );
        
        AmazonS3 s3 = AmazonS3ClientBuilder.standard()
            .withCredentials(new AWSStaticCredentialsProvider(awsCredentials))
            .build();
    }
}
```

### Advanced Configuration

```java
import com.zerotrustkerberos.ZeroTrustClient;
import com.zerotrustkerberos.config.SecurityConfig;
import com.zerotrustkerberos.config.LogLevel;

public class AdvancedExample {
    public static void main(String[] args) {
        // Configure security settings
        SecurityConfig securityConfig = SecurityConfig.builder()
            .verifySsl(true)
            .sessionDuration(3600)
            .cacheCredentials(true)
            .encryptCache(true)
            .build();
        
        // Initialize client with advanced configuration
        ZeroTrustClient client = ZeroTrustClient.builder()
            .serverUrl("https://your-zerotrustkerberos-deployment.example.com")
            .kerberosPrincipal("user@EXAMPLE.COM")
            .kerberosKeytab("/path/to/keytab")
            .securityConfig(securityConfig)
            .logLevel(LogLevel.DEBUG)
            .build();
    }
}
```

## JavaScript/TypeScript SDK

### Installation

```bash
npm install zerotrust-kerberos-sdk
# or
yarn add zerotrust-kerberos-sdk
```

### Basic Usage (TypeScript)

```typescript
import { ZeroTrustClient } from 'zerotrust-kerberos-sdk';

async function example() {
    // Initialize client
    const client = new ZeroTrustClient({
        serverUrl: 'https://your-zerotrustkerberos-deployment.example.com',
        kerberosPrincipal: 'user@EXAMPLE.COM',
        kerberosKeytab: '/path/to/keytab'
    });
    
    // Authenticate
    await client.authenticate();
    
    // List available roles
    const roles = await client.listRoles();
    roles.forEach(role => {
        console.log(`Role: ${role.roleName}, ARN: ${role.roleArn}`);
    });
    
    // Assume a role
    const credentials = await client.assumeRole('arn:aws:iam::123456789012:role/Developer');
    
    // Use credentials with AWS SDK
    const AWS = require('aws-sdk');
    AWS.config.credentials = new AWS.Credentials({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken
    });
    
    const s3 = new AWS.S3();
}

example().catch(console.error);
```

### Advanced Configuration

```typescript
import { ZeroTrustClient, SecurityConfig, LogLevel } from 'zerotrust-kerberos-sdk';

// Configure security settings
const securityConfig: SecurityConfig = {
    verifySsl: true,
    sessionDuration: 3600,
    cacheCredentials: true,
    encryptCache: true
};

// Initialize client with advanced configuration
const client = new ZeroTrustClient({
    serverUrl: 'https://your-zerotrustkerberos-deployment.example.com',
    kerberosPrincipal: 'user@EXAMPLE.COM',
    kerberosKeytab: '/path/to/keytab',
    securityConfig,
    logLevel: LogLevel.DEBUG
});
```

## Go SDK

### Installation

```bash
go get github.com/zerotrustkerberos/zerotrust-kerberos-sdk-go
```

### Basic Usage

```go
package main

import (
    "fmt"
    
    zerotrust "github.com/zerotrustkerberos/zerotrust-kerberos-sdk-go"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/credentials"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/s3"
)

func main() {
    // Initialize client
    client, err := zerotrust.NewClient(&zerotrust.ClientConfig{
        ServerURL:         "https://your-zerotrustkerberos-deployment.example.com",
        KerberosPrincipal: "user@EXAMPLE.COM",
        KerberosKeytab:    "/path/to/keytab",
    })
    if err != nil {
        panic(err)
    }
    
    // Authenticate
    if err := client.Authenticate(); err != nil {
        panic(err)
    }
    
    // List available roles
    roles, err := client.ListRoles()
    if err != nil {
        panic(err)
    }
    
    for _, role := range roles {
        fmt.Printf("Role: %s, ARN: %s\n", role.RoleName, role.RoleARN)
    }
    
    // Assume a role
    creds, err := client.AssumeRole("arn:aws:iam::123456789012:role/Developer")
    if err != nil {
        panic(err)
    }
    
    // Use credentials with AWS SDK
    sess, err := session.NewSession(&aws.Config{
        Credentials: credentials.NewStaticCredentials(
            creds.AccessKeyID,
            creds.SecretAccessKey,
            creds.SessionToken,
        ),
    })
    if err != nil {
        panic(err)
    }
    
    s3Client := s3.New(sess)
    // Use s3Client...
}
```

### Advanced Configuration

```go
package main

import (
    zerotrust "github.com/zerotrustkerberos/zerotrust-kerberos-sdk-go"
)

func main() {
    // Configure security settings
    securityConfig := &zerotrust.SecurityConfig{
        VerifySSL:        true,
        SessionDuration:  3600,
        CacheCredentials: true,
        EncryptCache:     true,
    }
    
    // Initialize client with advanced configuration
    client, err := zerotrust.NewClient(&zerotrust.ClientConfig{
        ServerURL:         "https://your-zerotrustkerberos-deployment.example.com",
        KerberosPrincipal: "user@EXAMPLE.COM",
        KerberosKeytab:    "/path/to/keytab",
        SecurityConfig:    securityConfig,
        LogLevel:          zerotrust.LogLevelDebug,
    })
    if err != nil {
        panic(err)
    }
}
```

## Ruby SDK

### Installation

```bash
gem install zerotrust-kerberos-sdk
```

### Basic Usage

```ruby
require 'zerotrust_kerberos'

# Initialize client
client = ZeroTrustKerberos::Client.new(
  server_url: 'https://your-zerotrustkerberos-deployment.example.com',
  kerberos_principal: 'user@EXAMPLE.COM',
  kerberos_keytab: '/path/to/keytab'
)

# Authenticate
client.authenticate

# List available roles
roles = client.list_roles
roles.each do |role|
  puts "Role: #{role.role_name}, ARN: #{role.role_arn}"
end

# Assume a role
credentials = client.assume_role('arn:aws:iam::123456789012:role/Developer')

# Use credentials with AWS SDK
require 'aws-sdk-s3'

Aws.config.update(
  credentials: Aws::Credentials.new(
    credentials.access_key_id,
    credentials.secret_access_key,
    credentials.session_token
  )
)

s3 = Aws::S3::Client.new
```

### Advanced Configuration

```ruby
require 'zerotrust_kerberos'

# Configure security settings
security_config = ZeroTrustKerberos::SecurityConfig.new(
  verify_ssl: true,
  session_duration: 3600,
  cache_credentials: true,
  encrypt_cache: true
)

# Initialize client with advanced configuration
client = ZeroTrustKerberos::Client.new(
  server_url: 'https://your-zerotrustkerberos-deployment.example.com',
  kerberos_principal: 'user@EXAMPLE.COM',
  kerberos_keytab: '/path/to/keytab',
  security_config: security_config,
  log_level: ZeroTrustKerberos::LogLevel::DEBUG
)
```

## Security Considerations

All SDKs implement the following security features:

1. **TLS Verification**: All communication with the server is verified using TLS
2. **Secure Credential Storage**: Credentials are stored securely in memory
3. **Credential Encryption**: Optional encryption for cached credentials
4. **Automatic Token Renewal**: Session tokens are automatically renewed when needed
5. **Input Validation**: All input is validated to prevent injection attacks

## Troubleshooting

### Common Issues

#### Authentication Failures

If authentication fails, check:
- Kerberos ticket validity
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

All SDKs provide comprehensive logging capabilities. Enable debug logging for more information.

## Version Compatibility

| SDK Version | API Version | Minimum Server Version |
|-------------|-------------|------------------------|
| 1.0.x       | v1          | 1.0.0                  |
| 1.5.x       | v1          | 1.5.0                  |
| 2.0.x       | v2          | 2.0.0                  |

## Additional Resources

- [API Reference](rest-api.md)
- [CLI Reference](cli.md)
- [GitHub Repositories](https://github.com/zerotrustkerberos)
- [SDK Examples](https://github.com/zerotrustkerberos/examples)

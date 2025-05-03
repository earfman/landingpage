# REST API Reference

This document provides a comprehensive reference for the ZeroTrustKerberosLink REST API.

## API Overview

The ZeroTrustKerberosLink REST API allows you to programmatically interact with the service, enabling authentication, role management, and credential retrieval.

## Base URL

All API endpoints are relative to your ZeroTrustKerberosLink deployment URL:

```
https://your-zerotrustkerberos-deployment.example.com/api/v1
```

## Authentication

All API requests must be authenticated using one of the following methods:

### Kerberos Authentication

For endpoints that require Kerberos authentication, include the Kerberos ticket in the `Authorization` header:

```
Authorization: Negotiate <base64-encoded-kerberos-ticket>
```

### API Key Authentication

For service-to-service communication, use API key authentication:

```
Authorization: Bearer <api-key>
```

## Rate Limiting

API requests are subject to rate limiting to prevent abuse. The current limits are:

- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

Rate limit headers are included in all API responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

## Error Handling

The API uses standard HTTP status codes to indicate success or failure:

- 2xx: Success
- 4xx: Client error
- 5xx: Server error

Error responses include a JSON body with details:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The request is missing a required parameter",
    "details": {
      "parameter": "role_arn"
    }
  }
}
```

## API Endpoints

### Authentication

#### Authenticate with Kerberos

```
POST /auth/kerberos
```

Authenticates a user with a Kerberos ticket and returns a session token.

**Request Headers:**

```
Authorization: Negotiate <base64-encoded-kerberos-ticket>
```

**Response:**

```json
{
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-05-01T23:59:59Z"
}
```

### Role Management

#### List Available Roles

```
GET /roles
```

Returns a list of AWS IAM roles available to the authenticated user.

**Request Headers:**

```
Authorization: Bearer <session-token>
```

**Response:**

```json
{
  "roles": [
    {
      "role_arn": "arn:aws:iam::123456789012:role/Developer",
      "account_id": "123456789012",
      "role_name": "Developer",
      "description": "Developer role with limited access"
    },
    {
      "role_arn": "arn:aws:iam::123456789012:role/Admin",
      "account_id": "123456789012",
      "role_name": "Admin",
      "description": "Administrator role with full access"
    }
  ]
}
```

### Credentials

#### Assume Role

```
POST /credentials
```

Assumes an AWS IAM role and returns temporary credentials.

**Request Headers:**

```
Authorization: Bearer <session-token>
```

**Request Body:**

```json
{
  "role_arn": "arn:aws:iam::123456789012:role/Developer",
  "duration_seconds": 3600
}
```

**Response:**

```json
{
  "credentials": {
    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "session_token": "AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE...",
    "expiration": "2025-05-01T23:59:59Z"
  },
  "assumed_role_user": {
    "assumed_role_id": "AROAIOSFODNN7EXAMPLE:session-name",
    "arn": "arn:aws:sts::123456789012:assumed-role/Developer/session-name"
  }
}
```

### Session Management

#### Get Session Info

```
GET /session
```

Returns information about the current session.

**Request Headers:**

```
Authorization: Bearer <session-token>
```

**Response:**

```json
{
  "user": {
    "principal": "user@EXAMPLE.COM",
    "groups": ["developers", "testers"]
  },
  "session": {
    "created_at": "2025-05-01T12:00:00Z",
    "expires_at": "2025-05-01T23:59:59Z",
    "last_activity": "2025-05-01T12:05:00Z"
  }
}
```

#### Invalidate Session

```
DELETE /session
```

Invalidates the current session.

**Request Headers:**

```
Authorization: Bearer <session-token>
```

**Response:**

```json
{
  "message": "Session invalidated successfully"
}
```

## Security Considerations

All API requests should be made over HTTPS to ensure the confidentiality and integrity of the data. The API implements the following security measures:

1. **TLS**: All connections must use TLS 1.2 or higher with strong cipher suites
2. **Input Validation**: All request parameters are validated to prevent injection attacks
3. **Rate Limiting**: Prevents abuse through excessive requests
4. **Security Headers**: Includes security headers like CSP, HSTS, and X-XSS-Protection
5. **Audit Logging**: All API requests are logged for security auditing

## API Versioning

The API is versioned using the URL path (e.g., `/api/v1`). When breaking changes are introduced, a new API version will be released, and the previous version will be supported for a minimum of 12 months.

## SDK Support

For easier integration, SDKs are available for the following languages:

- Python
- Java
- JavaScript/TypeScript
- Go
- Ruby

See the [SDK documentation](sdk.md) for more information.

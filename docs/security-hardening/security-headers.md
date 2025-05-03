# Security Headers

Security headers are a crucial part of ZeroTrustKerberosLink's defense-in-depth strategy. These HTTP response headers instruct browsers to enable built-in security features and prevent common web vulnerabilities.

## Implemented Security Headers

ZeroTrustKerberosLink implements the following security headers by default:

### Content Security Policy (CSP)

Content Security Policy restricts which resources can be loaded by the browser, preventing cross-site scripting (XSS) and data injection attacks.

```
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';
```

#### Configuration Options

```yaml
security:
  headers:
    content_security_policy:
      enabled: true
      policy: "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
      report_only: false
      report_uri: "/csp-report"
```

### X-XSS-Protection

This header enables the browser's built-in XSS filter to prevent reflected cross-site scripting attacks.

```
X-XSS-Protection: 1; mode=block
```

#### Configuration Options

```yaml
security:
  headers:
    xss_protection:
      enabled: true
      mode: "block"
```

### X-Content-Type-Options

Prevents browsers from MIME-sniffing a response away from the declared content type, reducing the risk of drive-by downloads and MIME confusion attacks.

```
X-Content-Type-Options: nosniff
```

#### Configuration Options

```yaml
security:
  headers:
    content_type_options:
      enabled: true
```

### X-Frame-Options

Controls whether the browser should allow the page to be rendered in a frame, iframe, embed, or object, preventing clickjacking attacks.

```
X-Frame-Options: DENY
```

#### Configuration Options

```yaml
security:
  headers:
    frame_options:
      enabled: true
      mode: "DENY"  # Options: DENY, SAMEORIGIN, ALLOW-FROM
      allow_from: ""  # Only used with ALLOW-FROM
```

### Strict-Transport-Security (HSTS)

Forces browsers to use HTTPS for the specified domain, protecting against protocol downgrade attacks and cookie hijacking.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### Configuration Options

```yaml
security:
  headers:
    strict_transport_security:
      enabled: true
      max_age: 31536000  # 1 year in seconds
      include_subdomains: true
      preload: true
```

### Permissions-Policy

Controls which browser features and APIs can be used in the application, reducing the attack surface.

```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

#### Configuration Options

```yaml
security:
  headers:
    permissions_policy:
      enabled: true
      policies:
        geolocation: []
        microphone: []
        camera: []
```

### Cache-Control

Controls how pages can be cached by browsers and proxies, preventing sensitive information from being stored in caches.

```
Cache-Control: no-store, max-age=0
```

#### Configuration Options

```yaml
security:
  headers:
    cache_control:
      enabled: true
      directives: "no-store, max-age=0"
```

## Comprehensive Header Configuration

Below is a complete example configuration for all security headers:

```yaml
security:
  headers:
    enabled: true
    
    content_security_policy:
      enabled: true
      policy: "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
      report_only: false
      report_uri: "/csp-report"
    
    xss_protection:
      enabled: true
      mode: "block"
    
    content_type_options:
      enabled: true
    
    frame_options:
      enabled: true
      mode: "DENY"
    
    strict_transport_security:
      enabled: true
      max_age: 31536000
      include_subdomains: true
      preload: true
    
    permissions_policy:
      enabled: true
      policies:
        geolocation: []
        microphone: []
        camera: []
    
    cache_control:
      enabled: true
      directives: "no-store, max-age=0"
```

## Security Header Testing

ZeroTrustKerberosLink provides tools to test the implementation of security headers:

```bash
# Test all security headers
zerotrustkerberos-cli test headers

# Test specific header
zerotrustkerberos-cli test headers --header=csp
```

You can also use external tools like [securityheaders.com](https://securityheaders.com) to validate your headers.

## Best Practices

To maximize the effectiveness of security headers:

1. **Enable All Headers**: Keep all security headers enabled
2. **Customize CSP**: Tailor the Content Security Policy to your specific needs
3. **Test Thoroughly**: Test your application with all headers enabled
4. **Monitor Reports**: Set up monitoring for CSP violation reports
5. **Regular Updates**: Keep your security header configuration updated

## Related Security Features

Security headers work in conjunction with other security features:

- [Input Validation](./input-validation.md)
- [Secure Communications](./secure-communications.md)
- [Authentication Controls](../configuration/authentication.md)

## Further Reading

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Content Security Policy Reference](https://content-security-policy.com/)

# Security Patterns Reference

Patterns for the Security section of code-review skill.

---

## OWASP Top 10 (2021) Checklist

### A01:2021 - Broken Access Control

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Missing authorization check | Route/function accesses resource without verifying user permissions | Critical |
| IDOR vulnerability | User-supplied ID used directly to fetch resources without ownership check | Critical |
| Path traversal | User input in file paths without sanitization (`../` patterns) | Critical |
| CORS misconfiguration | `Access-Control-Allow-Origin: *` with credentials | Important |

**Detection Approach:**
- Look for database queries/file access without preceding auth check
- Check if user-supplied IDs are validated against session user
- Verify CORS headers in response configuration

### A02:2021 - Cryptographic Failures

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Hardcoded secrets | API keys, passwords, tokens in source code | Critical |
| Weak hashing | MD5, SHA1 for passwords | Critical |
| Missing encryption | Sensitive data stored/transmitted in plaintext | Critical |
| Insecure random | `Math.random()` for security-sensitive operations | Important |

**Detection Approach:**
- Regex for common secret patterns (API_KEY, PASSWORD, SECRET)
- Check crypto library usage (bcrypt vs md5)
- Verify TLS usage for sensitive data

### A03:2021 - Injection

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| SQL injection | String concatenation in SQL queries | Critical |
| NoSQL injection | User input in MongoDB queries without sanitization | Critical |
| Command injection | User input in exec/spawn without escaping | Critical |
| XSS | User input rendered without escaping | Critical |
| Template injection | User input in template strings | Important |

**Detection Approach:**
- Trace user input (req.query, req.body, req.params) to dangerous sinks
- Check for parameterized queries vs string concatenation
- Verify output encoding in templates

### A04:2021 - Insecure Design

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Missing rate limiting | Auth endpoints without throttling | Important |
| No account lockout | Unlimited login attempts | Important |
| Predictable tokens | Sequential/timestamp-based tokens | Critical |

### A05:2021 - Security Misconfiguration

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Debug mode in production | DEBUG=true, verbose error messages | Important |
| Default credentials | admin/admin, test/test in code | Critical |
| Unnecessary features | Unused endpoints exposed | Suggestion |

### A06:2021 - Vulnerable Components

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Known vulnerable packages | Outdated dependencies with CVEs | Varies |
| Unmaintained dependencies | No updates in 2+ years | Suggestion |

**Note:** Defer to `npm audit` / `pip-audit` for detailed analysis.

### A07:2021 - Auth Failures

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Session fixation | Session ID not regenerated after login | Critical |
| Weak password policy | No length/complexity requirements | Important |
| Missing MFA | Sensitive operations without 2FA | Suggestion |

### A08:2021 - Data Integrity Failures

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Unsigned data | CI/CD pipelines without artifact verification | Important |
| Insecure deserialization | Deserializing untrusted data | Critical |

### A09:2021 - Logging Failures

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Sensitive data in logs | Passwords, tokens logged | Critical |
| Missing audit logs | No logging for security events | Important |
| Log injection | User input in log messages without sanitization | Important |

### A10:2021 - SSRF

| Pattern | Detection Criteria | Severity |
|---------|-------------------|----------|
| Unvalidated URL fetch | User-supplied URL in fetch/axios without allowlist | Critical |
| Internal network access | User-controlled URLs that could access internal services | Critical |

---

## Detection Priority

1. **Trace user input**: req.query, req.body, req.params, URL params
2. **Identify dangerous sinks**: db.query, exec, eval, innerHTML, render
3. **Check for sanitization**: Between source and sink
4. **Verify context**: Is this test code? Is there upstream validation?

---

## False Positive Prevention

**Skip these patterns:**
- Parameterized queries (even with nearby concatenation)
- Test fixtures with intentional vulnerabilities
- Comments containing example code
- Sanitization applied before dangerous sink
- Internal-only endpoints with network-level protection

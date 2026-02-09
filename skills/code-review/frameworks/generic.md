# Generic Framework Patterns

Security and quality patterns applicable to any codebase when no specific framework is detected.

---

## Security Patterns (OWASP Top 10)

### A01: Broken Access Control

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Missing authorization | Resource access without permission check | Critical |
| IDOR | User ID from input used directly | Critical |
| Path traversal | User input in file paths | Critical |

**Check:**
- Every database query has a preceding authorization check
- User-supplied IDs are validated against session user
- File paths are restricted to allowed directories

### A02: Cryptographic Failures

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Hardcoded secrets | Strings matching key/password patterns | Critical |
| Weak algorithms | MD5, SHA1 for passwords | Critical |
| Missing encryption | Sensitive data in plaintext | Critical |

**Check:**
- No API keys, passwords, or tokens in source
- Password hashing uses bcrypt, argon2, or scrypt
- Sensitive data encrypted at rest and in transit

### A03: Injection

| Pattern | Detection | Severity |
|---------|-----------|----------|
| SQL injection | String concatenation in queries | Critical |
| Command injection | User input in shell commands | Critical |
| XSS | User input in HTML output | Critical |

**Check:**
- All queries use parameterization
- Shell commands use array form or escape input
- Output is escaped for context (HTML, JS, URL)

### A04: Insecure Design

| Pattern | Detection | Severity |
|---------|-----------|----------|
| No rate limiting | Auth endpoints unrestricted | Important |
| Weak tokens | Predictable patterns | Critical |
| Missing business logic validation | Edge cases not handled | Important |

### A05: Security Misconfiguration

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Debug mode | Verbose errors, stack traces | Important |
| Default credentials | admin/admin patterns | Critical |
| Unnecessary features | Unused endpoints exposed | Suggestion |

### A06: Vulnerable Components

**Note:** Defer to package audit tools:
- `npm audit` / `yarn audit`
- `pip-audit`
- `cargo audit`

### A07: Auth Failures

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Session fixation | No regeneration after login | Critical |
| Weak passwords | No complexity requirements | Important |
| Credential exposure | Logging passwords | Critical |

### A08: Data Integrity

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Insecure deserialization | Deserializing untrusted data | Critical |
| Missing integrity checks | Data modification undetected | Important |

### A09: Logging Failures

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Missing audit logs | No security event logging | Important |
| Sensitive data logged | Passwords, tokens in logs | Critical |
| Log injection | Unsanitized input in logs | Important |

### A10: SSRF

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Unvalidated URL fetch | User URL without allowlist | Critical |
| Internal access | Requests to internal services | Critical |

---

## Type Safety Patterns

| Pattern | Issue | Fix |
|---------|-------|-----|
| `any` type | Bypasses type checking | Define proper interface |
| Missing null checks | Runtime null errors | Use optional chaining |
| Unsafe assertions | Type lies to compiler | Use type guards |
| Implicit any | Missing type annotations | Enable strict mode |

---

## Linting Patterns

| Pattern | Threshold | Action |
|---------|-----------|--------|
| Cyclomatic complexity | >15 | Refactor |
| Nesting depth | >4 | Use early returns |
| Function length | >50 lines | Split function |
| Magic numbers | Any | Use named constants |

---

## Coding Standards

### CS1: Single Responsibility
Each function should have one purpose.

### CS2: No Magic
All values and behaviors should be explicit.

### CS3: Fail Fast
Validate inputs early, throw on errors.

### CS4: Clean Code
No unused code, no commented blocks.

---

## What to Skip

- Test fixtures with intentional issues
- Documentation examples
- Generated code
- Third-party integrations following external patterns

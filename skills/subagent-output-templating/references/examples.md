# Sub-Agent Output Examples

Extended examples for different agent types and scenarios.

---

## Code Auditor Output Example

```yaml
# logs/bulwark-code-auditor-20260111-143022.yaml

metadata:
  agent: bulwark-code-auditor
  timestamp: 2026-01-11T14:30:22Z
  model: sonnet
  task_id: "security-audit-auth-module"
  duration_ms: 8520

goal: "Identify security vulnerabilities in authentication module that could allow unauthorized access"

completion:
  why:
    problem: "Multiple security issues found in authentication flow"
    root_cause: "Insufficient input validation and outdated hashing algorithm"
    solution: "Fixed validation, upgraded to argon2, added rate limiting"

  what:
    - file: src/auth/login.ts
      lines: "23-45"
      change: "Added input sanitization for username and password fields"
    - file: src/auth/password.ts
      lines: "12-30"
      change: "Replaced bcrypt with argon2id for password hashing"
    - file: src/auth/middleware.ts
      lines: "56-78"
      change: "Added rate limiting (5 attempts per 15 minutes)"
    - file: src/auth/login.test.ts
      lines: "89-145"
      change: "Added tests for SQL injection, rate limiting, and hash verification"

  trade_offs:
    gained:
      - "Security: OWASP Top 10 injection prevention"
      - "Security: Modern password hashing (argon2id)"
      - "Security: Brute force protection via rate limiting"
    cost:
      - "Performance: Argon2 is ~3x slower than bcrypt (acceptable for auth)"
      - "Complexity: Rate limiter requires Redis dependency"
      - "Migration: Existing passwords need re-hashing on next login"

  risks:
    - risk: "Users with old bcrypt hashes must re-authenticate"
      mitigation: "Dual-hash support during 90-day migration window"
      severity: medium
    - risk: "Rate limiter could block legitimate users on shared IPs"
      mitigation: "Whitelist known corporate IP ranges"
      severity: low
    - risk: "Redis failure would disable rate limiting"
      mitigation: "Fallback to in-memory rate limiting with shorter window"
      severity: medium

  next_steps:
    - "Deploy Redis cluster in staging"
    - "Run migration script for password re-hashing"
    - "Monitor failed login rates for anomalies"
    - "Schedule security review in 30 days"

summary: |
  Found 3 security issues in auth module:
  - Critical: SQL injection in login (fixed with parameterized queries)
  - High: Weak bcrypt hashing (upgraded to argon2id)
  - Medium: No brute force protection (added rate limiting)

  All issues fixed with comprehensive tests. Requires Redis for rate limiting.
  90-day migration window for password re-hashing.
  Next: deploy to staging, monitor for 48h.

diagnostics:
  model_requested: sonnet
  model_actual: sonnet
  context_type: forked
  parent_vars_accessible: false
  hooks_fired:
    - Stop
  execution_time_ms: 8520
  completion_status: success
```

---

## Test Auditor Output Example

```yaml
# logs/bulwark-test-auditor-20260111-151245.yaml

metadata:
  agent: bulwark-test-auditor
  timestamp: 2026-01-11T15:12:45Z
  model: sonnet
  task_id: "test-audit-api-module"
  duration_ms: 5340

goal: "Classify tests in api/ module and identify mock-heavy tests that should verify real behavior"

completion:
  why:
    problem: "Test suite has high coverage but low confidence due to excessive mocking"
    root_cause: "Tests mock HTTP clients and database, verifying mocks not behavior"
    solution: "Identified 12 tests for rewrite to use real integrations"

  what:
    - file: src/api/users.test.ts
      lines: "all"
      change: "FLAGGED: 8 tests mock axios, verify mock calls not responses"
    - file: src/api/orders.test.ts
      lines: "45-120"
      change: "FLAGGED: 4 tests mock database, never verify actual data"
    - file: src/api/health.test.ts
      lines: "all"
      change: "OK: Tests actual endpoint, verifies real response"

  trade_offs:
    gained:
      - "Visibility: Clear inventory of mock-heavy tests"
      - "Priority: Tests ranked by rewrite urgency"
    cost:
      - "Effort: 12 tests need significant rewrite"
      - "Infrastructure: Real integration tests need test database"

  risks:
    - risk: "Rewriting tests may uncover hidden bugs"
      mitigation: "Run old and new tests in parallel during transition"
      severity: low
    - risk: "Integration tests are slower"
      mitigation: "Separate unit and integration test runs"
      severity: low

  next_steps:
    - "Set up test database container"
    - "Rewrite users.test.ts first (highest priority)"
    - "Create verification scripts for API endpoints"

summary: |
  Audited 15 test files in api/ module.
  Classification: 3 real integration tests, 12 mock-heavy tests.
  Priority rewrites: users.test.ts (8 tests), orders.test.ts (4 tests).
  Recommendation: Set up test database, rewrite in priority order.

diagnostics:
  model_requested: sonnet
  model_actual: sonnet
  context_type: forked
  parent_vars_accessible: false
  hooks_fired:
    - Stop
  execution_time_ms: 5340
  completion_status: success
```

---

## Issue Debugger Output Example

```yaml
# logs/bulwark-issue-debugger-20260111-162030.yaml

metadata:
  agent: bulwark-issue-debugger
  timestamp: 2026-01-11T16:20:30Z
  model: sonnet
  task_id: "debug-issue-memory-leak"
  duration_ms: 12450

goal: "Identify root cause of memory leak reported in production WebSocket server"

completion:
  why:
    problem: "Server memory grows 50MB/hour, requires daily restarts"
    root_cause: "Event listeners not removed on WebSocket disconnect"
    solution: "Added cleanup in disconnect handler, verified with memory profiling"

  what:
    - file: src/ws/connection.ts
      lines: "67-89"
      change: "Added removeAllListeners() in onDisconnect handler"
    - file: src/ws/connection.test.ts
      lines: "156-198"
      change: "Added test that simulates 1000 connect/disconnect cycles"
    - file: logs/debugging-memory-leak.md
      lines: "all"
      change: "Documented debugging journey with heap snapshots"

  trade_offs:
    gained:
      - "Stability: Memory now stable over 72h test run"
      - "Performance: No degradation from cleanup"
    cost:
      - "None identified"

  risks:
    - risk: "Other event sources may have similar leaks"
      mitigation: "Added memory monitoring dashboard, alert at 80% threshold"
      severity: low

  next_steps:
    - "Deploy to staging, run 72h soak test"
    - "Add memory metrics to production monitoring"
    - "Audit other WebSocket handlers for similar patterns"

summary: |
  Root cause identified: event listeners not cleaned up on WebSocket disconnect.
  Fixed in connection.ts:67-89, added regression test with 1000 cycle simulation.
  Memory stable over 72h test run. Ready for staging deployment.
  Next: 72h soak test in staging, then production rollout.

diagnostics:
  model_requested: sonnet
  model_actual: sonnet
  context_type: forked
  parent_vars_accessible: false
  hooks_fired:
    - Stop
  execution_time_ms: 12450
  completion_status: success
```

---

## Implementer Output Example

```yaml
# logs/bulwark-implementer-20260111-173500.yaml

metadata:
  agent: bulwark-implementer
  timestamp: 2026-01-11T17:35:00Z
  model: sonnet
  task_id: "implement-password-reset"
  duration_ms: 15780

goal: "Implement password reset flow with email verification following security best practices"

completion:
  why:
    problem: "Users cannot reset forgotten passwords"
    root_cause: "Feature not implemented"
    solution: "Full password reset flow with secure token generation and email"

  what:
    - file: src/auth/reset.ts
      lines: "1-85"
      change: "New file: password reset request and verification handlers"
    - file: src/auth/reset.test.ts
      lines: "1-120"
      change: "New file: tests for token generation, expiry, and reset flow"
    - file: src/email/templates/reset.html
      lines: "1-45"
      change: "New file: password reset email template"
    - file: src/routes/auth.ts
      lines: "34-42"
      change: "Added POST /reset-request and POST /reset-verify routes"
    - file: prisma/schema.prisma
      lines: "45-52"
      change: "Added PasswordResetToken model"

  trade_offs:
    gained:
      - "Feature: Users can reset passwords via email"
      - "Security: Tokens expire in 1 hour, single-use"
      - "UX: Clear error messages for invalid/expired tokens"
    cost:
      - "Dependency: Requires email service (SendGrid configured)"
      - "Database: New table for reset tokens"

  risks:
    - risk: "Email delivery delays could frustrate users"
      mitigation: "Added 'check spam folder' messaging, retry button"
      severity: low
    - risk: "Token enumeration attack"
      mitigation: "Consistent response time regardless of email existence"
      severity: medium

  next_steps:
    - "Configure SendGrid API key in production"
    - "Run database migration for PasswordResetToken"
    - "Add rate limiting to reset-request endpoint"
    - "QA: Test with multiple email providers"

summary: |
  Implemented password reset flow: POST /reset-request and /reset-verify.
  Created reset.ts handler, reset.test.ts (12 tests), email template.
  Security: 1-hour token expiry, single-use, constant-time responses.
  Requires: SendGrid config, database migration, rate limiting (TODO).

diagnostics:
  model_requested: sonnet
  model_actual: sonnet
  context_type: forked
  parent_vars_accessible: false
  hooks_fired:
    - Stop
  execution_time_ms: 15780
  completion_status: success
```

---

## Error Output Example

When a sub-agent encounters an error, the output format remains consistent:

```yaml
# logs/bulwark-code-auditor-20260111-180000.yaml

metadata:
  agent: bulwark-code-auditor
  timestamp: 2026-01-11T18:00:00Z
  model: sonnet
  task_id: "audit-legacy-module"
  duration_ms: 2340

goal: "Audit legacy payment module for security vulnerabilities"

completion:
  why:
    problem: "Unable to complete audit"
    root_cause: "Target files not found at specified paths"
    solution: "No action taken - requires path correction"

  what: []

  trade_offs:
    gained: []
    cost:
      - "Time: 2.3 seconds spent before failure detection"

  risks:
    - risk: "Payment module may contain unaudited vulnerabilities"
      mitigation: "Retry with correct file paths"
      severity: high

  next_steps:
    - "Verify file paths: src/payments/ does not exist"
    - "Check if module was renamed or moved"
    - "Re-invoke with correct CONTEXT"

summary: |
  ERROR: Audit could not complete. Target path src/payments/ not found.
  0 files audited. Requires path correction and retry.
  Action: Verify module location and re-invoke.

diagnostics:
  model_requested: sonnet
  model_actual: sonnet
  context_type: forked
  parent_vars_accessible: false
  hooks_fired:
    - Stop
  execution_time_ms: 2340
  completion_status: error
```

---

## Summary Token Examples

### ~100 Tokens (Simple)

```
Found 1 critical issue: hardcoded API key in config.ts:23.
Removed and replaced with environment variable.
No risks. Ready for deployment.
```

### ~200 Tokens (Moderate)

```
Audited 8 test files in auth/ module.
Classification: 2 real integration tests, 6 mock-heavy tests.

Priority rewrites needed:
1. login.test.ts - mocks entire auth flow
2. session.test.ts - never verifies actual session storage

Set up test database required before rewrites.
Estimated effort: 4-6 hours for full rewrite.
```

### ~300 Tokens (Complex)

```
Security audit of payment module found 5 issues:

Critical (1):
- SQL injection in refund handler (fixed, parameterized queries added)

High (2):
- PCI data logged to console (fixed, scrubbed from logs)
- Missing CSRF protection on payment form (fixed, token added)

Medium (2):
- Outdated stripe-js dependency (upgraded to 3.x)
- Verbose error messages expose internals (sanitized)

All issues fixed with 15 new tests added.
Trade-off: Stripe upgrade requires testing with live sandbox.
Risk: Payment form changes may affect some older browsers.
Next: Full regression test in staging, then security team sign-off.
```

---

## Pipeline Chaining Example

When outputs feed into the next pipeline stage:

**Stage 1: Code Auditor**
```yaml
summary: |
  Found 3 issues: 1 critical (SQL injection), 2 medium (logging, error handling).
  Files affected: src/api/users.ts, src/api/orders.ts.
  Recommend: IssueDebugger for critical fix, then TestAuditor for coverage.
```

**Stage 2: Issue Debugger** (reads Stage 1 summary)
```yaml
summary: |
  Fixed SQL injection in users.ts:45-67 with parameterized queries.
  Added regression test in users.test.ts.
  Critical issue resolved. Medium issues still pending.
  Recommend: CodeAuditor re-scan to verify fix.
```

**Stage 3: Code Auditor** (re-scan)
```yaml
summary: |
  Re-audit of users.ts confirms SQL injection fixed.
  2 medium issues remain in orders.ts.
  Pipeline can continue or address medium issues.
```

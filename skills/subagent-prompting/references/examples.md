# Sub-Agent Prompting Examples

Extended examples for the subagent-prompting skill. Load this file for detailed reference when designing sub-agent invocations.

---

## Example 1: Code Auditor Invocation

### Complete 4-Part Prompt

```markdown
## GOAL

Identify security vulnerabilities and code quality issues in the authentication module that could lead to unauthorized access or data exposure.

## CONSTRAINTS

- Do NOT modify any files - this is read-only analysis
- Focus only on files in `src/auth/` directory
- Do NOT analyze test files
- Complete analysis within 30 tool calls
- Identify issues only - do NOT implement fixes

## CONTEXT

### Files to Analyze
- `src/auth/login.ts` - Handles user login flow
- `src/auth/session.ts` - Session management
- `src/auth/middleware.ts` - Auth middleware for routes
- `src/auth/tokens.ts` - JWT token handling

### Related Context
- Previous audit found XSS in user input handling (fixed in v2.1)
- Session tokens use RS256 algorithm
- No rate limiting currently implemented

### Standards to Apply
- OWASP Top 10 2021
- Company security policy v3.2
- TypeScript strict mode compliance

## OUTPUT

### Primary Deliverable
Write findings to: `logs/code-auditor-20260110-143022.md`

### Output Format
```markdown
# Security Audit Report

## Critical Issues
[List with file:line references]

## High Priority Issues
[List with file:line references]

## Medium Priority Issues
[List with file:line references]

## Recommendations
[Prioritized action items]
```

### Summary Requirements
Return to main thread: Max 200 tokens summarizing critical findings count and top recommendation.

### Diagnostic Output
Write to: `logs/diagnostics/code-auditor-20260110-143022.yaml`
```

---

## Example 2: Test Auditor Invocation

### Complete 4-Part Prompt

```markdown
## GOAL

Classify all tests in the repository to identify mock-heavy tests that verify mock behavior rather than real system behavior.

## CONSTRAINTS

- Read-only analysis - do NOT modify test files
- Process all files matching `**/*.test.ts` and `**/*.spec.ts`
- Flag tests where >50% of assertions verify mock calls
- Do NOT flag integration tests that use real dependencies

## CONTEXT

### Test Patterns to Recognize

**Real Integration Test Indicators:**
- Spawns actual processes
- Makes real HTTP requests
- Reads/writes actual files
- Uses real database connections

**Mock-Heavy Test Indicators:**
- jest.mock() or vi.mock() for system under test
- Assertions on mock.toHaveBeenCalledWith()
- No actual output verification
- Mocked spawn/exec for CLI tools

### Known Good Tests (Do Not Flag)
- `tests/integration/` directory - all real integration tests
- `tests/e2e/` directory - end-to-end tests

## OUTPUT

### Primary Deliverable
Write to: `logs/test-auditor-20260110-150000.yaml`

### Output Format
```yaml
summary:
  total_tests: 156
  real_tests: 89
  mock_heavy: 67

classifications:
  - file: src/auth/__tests__/login.test.ts
    type: mock_heavy
    mock_percentage: 85
    reason: "Mocks entire auth service, verifies mock calls only"
    priority: high

  - file: tests/integration/api.test.ts
    type: real
    mock_percentage: 0
    reason: "Spawns actual server, makes real HTTP requests"
```

### Summary Requirements
Return: "Classified X tests: Y real, Z mock-heavy (priority rewrite: N)"

### Diagnostic Output
Write to: `logs/diagnostics/test-auditor-20260110-150000.yaml`
```

---

## Example 3: Issue Debugger with Validation Loop

### Complete 4-Part Prompt

```markdown
## GOAL

Identify the root cause of failing login tests and implement a fix that passes all tests without breaking existing functionality.

## CONSTRAINTS

- Only modify files directly related to the bug
- Do NOT refactor unrelated code
- Maintain backward API compatibility
- All existing tests must continue to pass
- New fix must include a regression test

## CONTEXT

### Failing Test Output
```
FAIL src/auth/__tests__/login.test.ts
  ✕ should reject expired tokens (45ms)

  Expected: 401 Unauthorized
  Received: 200 OK

  at src/auth/middleware.ts:47
```

### Recent Changes
- Commit abc123: "Refactored token validation" (3 days ago)
- This is when tests started failing

### Files to Investigate
- `src/auth/middleware.ts:47` - Error location
- `src/auth/tokens.ts` - Token validation logic
- `src/auth/__tests__/login.test.ts` - Failing test

## OUTPUT

### Primary Deliverable
Write debug journey to: `logs/issue-debugger-20260110-160000.md`

### Output Format
```markdown
# Debug Journey

## Root Cause Analysis
[Detailed explanation with file:line references]

## Fix Applied
[Description of changes made]

## Files Modified
- [file1]: [what changed]
- [file2]: [what changed]

## Verification
- [ ] Failing test now passes
- [ ] All other tests still pass
- [ ] Regression test added

## Test Output
[Paste final test results]
```

### Validation Loop
MUST run tests after fix:
1. Apply fix
2. Run: `npx jest` (or your project test runner)
3. IF tests fail: Analyze, adjust, repeat
4. IF tests pass: Document and complete

### Summary Requirements
Return: "Fixed [root cause] in [file]. All X tests passing."

### Diagnostic Output
Write to: `logs/diagnostics/issue-debugger-20260110-160000.yaml`
```

---

## Example 4: Pipeline Orchestration (Main Thread)

### Code Review Pipeline Implementation

```markdown
# Main Thread Orchestration

## Step 1: Security Audit
```python
result1 = Task(
    description="Security audit of auth module",
    subagent_type="sonnet",
    prompt="[4-part prompt for security audit]"
)
# Read: logs/code-auditor-security-*.md
security_findings = extract_findings(result1)
```

## Step 2: Architecture Audit
```python
result2 = Task(
    description="Architecture review of auth module",
    subagent_type="sonnet",
    prompt="[4-part prompt for architecture review]"
)
# Read: logs/code-auditor-architecture-*.md
arch_findings = extract_findings(result2)
```

## Step 3: Test Coverage Audit
```python
result3 = Task(
    description="Test coverage analysis",
    subagent_type="haiku",
    prompt="[4-part prompt for test coverage]"
)
# Read: logs/test-auditor-*.yaml
test_findings = extract_findings(result3)
```

## Step 4: Conditional Branch
```python
total_findings = security_findings + arch_findings + test_findings
if total_findings > 0:
    Task(
        description="Fix identified issues",
        subagent_type="sonnet",
        prompt="[4-part prompt including all findings as CONTEXT]"
    )
else:
    # Pipeline complete - all checks passed
    log_success()
```
```

---

## Common Mistakes to Avoid

### Mistake 1: Missing CONSTRAINTS

**Bad:**
```markdown
## GOAL
Review the auth code.

## CONTEXT
Look at src/auth/

## OUTPUT
Tell me what you find.
```

**Good:**
```markdown
## GOAL
Identify security vulnerabilities in authentication that could allow unauthorized access.

## CONSTRAINTS
- Read-only analysis - do NOT modify files
- Focus on OWASP Top 10 categories
- Complete within 25 tool calls

## CONTEXT
[Specific files, standards, background]

## OUTPUT
[Specific log path, format, summary requirements]
```

### Mistake 2: Vague OUTPUT Specification

**Bad:**
```markdown
## OUTPUT
Return the results.
```

**Good:**
```markdown
## OUTPUT
Write to: `logs/auditor-20260110.md`
Format: Markdown with Critical/High/Medium sections
Summary: Max 200 tokens with finding counts
Diagnostic: `logs/diagnostics/auditor-20260110.yaml`
```

### Mistake 3: No Diagnostic Output

**Bad:** (missing diagnostic section entirely)

**Good:**
```markdown
### Diagnostic Output
Write to: `logs/diagnostics/{agent}-{timestamp}.yaml`
Include: model_actual, execution_time_ms, completion_status
```

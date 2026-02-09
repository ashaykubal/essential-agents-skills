# Coding Standards Patterns Reference

Patterns for the Coding Standards section of code-review skill.

---

## Atomic Principles (from Rules.md)

### CS1: Single Responsibility

Every function, class, and module should have ONE purpose.

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Function does multiple things | Multiple comments describing phases | Important |
| Class with unrelated methods | Methods operating on different data | Important |
| Module with mixed exports | Utilities + domain logic in same file | Suggestion |

**Good Example:**
```typescript
// Single purpose: validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

**Anti-pattern:**
```typescript
// Multiple purposes: validate AND send AND log
function processEmail(email: string): void {
  if (!isValidEmail(email)) throw new Error('Invalid');
  sendEmail(email);
  logAction('email_sent', email);
}
```

### CS2: No Magic

No implicit behaviors, hidden dependencies, or undocumented side effects.

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Magic numbers | Hardcoded values without names | Suggestion |
| Hidden mutations | Function modifies input object | Important |
| Implicit globals | Using undeclared global state | Important |
| Side effects in getters | Property access triggers actions | Important |

**Good Example:**
```typescript
const MAX_RETRY_ATTEMPTS = 3;
const TIMEOUT_MS = 5000;

async function fetchWithRetry(url: string): Promise<Response> {
  // explicit constants, no hidden behavior
}
```

**Anti-pattern:**
```typescript
async function fetch(url: string): Promise<Response> {
  // Magic numbers, unclear behavior
  for (let i = 0; i < 3; i++) {
    await sleep(5000);
  }
}
```

### CS3: Fail Fast

Validate inputs at boundaries, return errors early, no silent failures.

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Missing input validation | Public function without checks | Important |
| Silent catch | `catch (e) {}` with no handling | Important |
| Default on error | Returning default instead of throwing | Suggestion |
| Deep error propagation | Error handled far from source | Suggestion |

**Good Example:**
```typescript
function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}
```

**Anti-pattern:**
```typescript
function divide(a: number, b: number): number {
  try {
    return a / b;
  } catch {
    return 0; // Silent failure, incorrect result
  }
}
```

### CS4: Clean Code

No unused code, no commented-out blocks, complete deletions.

| Pattern | Detection | Severity |
|---------|-----------|----------|
| Unused imports | Import not referenced in file | Suggestion |
| Unused variables | Variable declared but never used | Suggestion |
| Commented-out code | Large blocks of commented code | Important |
| Dead code | Unreachable code paths | Important |

**Detection Note:** Most of these are caught by linters. This section verifies linter was run.

---

## Documentation Patterns

### When to Document

| Situation | Documentation Required |
|-----------|----------------------|
| Public API | Yes - JSDoc with @param, @returns |
| Complex algorithm | Yes - Explain approach, not code |
| Non-obvious decision | Yes - Why this approach |
| Simple getter/setter | No - Self-evident |
| Internal helper | Optional |

### Good Documentation

```typescript
/**
 * Calculate compound interest with monthly compounding.
 *
 * Uses the formula: A = P(1 + r/n)^(nt)
 *
 * @param principal - Initial investment amount
 * @param rate - Annual interest rate (0.05 = 5%)
 * @param years - Investment duration in years
 * @returns Final amount after compound interest
 */
function calculateCompoundInterest(
  principal: number,
  rate: number,
  years: number
): number {
  const n = 12; // Monthly compounding
  return principal * Math.pow(1 + rate / n, n * years);
}
```

### Anti-pattern Documentation

```typescript
// BAD: Describes what, not why
// This function adds two numbers
function add(a: number, b: number): number {
  return a + b;
}

// BAD: Outdated documentation
/**
 * @deprecated Use newFunction instead
 * @param items - List of items to process
 */
function process(items: Item[], config: Config): Result {
  // Config parameter not documented
}
```

---

## Pattern Adherence

### Project-Specific Patterns

Check for consistency with existing codebase patterns:

| Pattern Type | Check |
|--------------|-------|
| Error handling | Same error types used? |
| Async patterns | Consistent Promise vs async/await? |
| Naming conventions | Follows existing style? |
| File organization | Matches project structure? |

### Common Inconsistencies

| Pattern | Example | Fix |
|---------|---------|-----|
| Mixed async styles | `then()` and `await` in same file | Pick one |
| Inconsistent exports | Named vs default exports | Follow project standard |
| Mixed error types | Custom errors vs plain Error | Use project error classes |

---

## Architecture Patterns

### Layer Violations

| Violation | Example | Severity |
|-----------|---------|----------|
| UI → Database | Component directly querying DB | Important |
| Controller → Repository | Skipping service layer | Suggestion |
| Cross-feature import | Feature A importing Feature B internals | Important |

### Dependency Direction

```
┌─────────────────────────────────────────┐
│              Presentation               │
│         (components, pages)             │
└───────────────────┬─────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              Application                │
│      (services, use cases)              │
└───────────────────┬─────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│               Domain                    │
│       (entities, value objects)         │
└───────────────────┬─────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            Infrastructure               │
│     (repositories, external APIs)       │
└─────────────────────────────────────────┘

Arrows indicate allowed import direction.
```

---

## Detection Priority

1. **Fail fast violations**: Check public function entry points
2. **Single responsibility**: Look for "and" in function names/descriptions
3. **Magic values**: Scan for hardcoded numbers, strings
4. **Documentation gaps**: Check public exports

---

## False Positive Prevention

**Skip these patterns:**
- Prototype/experimental code with explicit markers
- Third-party integration matching external conventions
- Auto-generated code (migrations, GraphQL schemas)
- Configuration files with intentional magic values
- Test files with intentional violations for testing

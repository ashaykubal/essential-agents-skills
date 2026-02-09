# Linting Patterns Reference

Patterns for the Linting section of code-review skill.

---

## Complexity Patterns

### Cyclomatic Complexity

| Level | Threshold | Severity | Guidance |
|-------|-----------|----------|----------|
| Low | 1-10 | OK | Simple, testable |
| Moderate | 11-20 | Suggestion | Consider refactoring |
| High | 21-50 | Important | Should refactor |
| Very High | 50+ | Important | Must refactor |

**Detection:**
- Count decision points: if, else, case, &&, ||, ?:, catch
- Each decision point adds 1 to complexity
- Nested conditions multiply cognitive load

### Nesting Depth

| Level | Threshold | Severity |
|-------|-----------|----------|
| Acceptable | 1-3 levels | OK |
| Warning | 4 levels | Suggestion |
| Problem | 5+ levels | Important |

**Detection:**
```typescript
// 5 levels of nesting - IMPORTANT
if (a) {
  if (b) {
    for (const x of items) {
      if (x.valid) {
        try {
          // deeply nested logic
        }
      }
    }
  }
}
```

**Remediation:**
- Early returns to flatten conditionals
- Extract to helper functions
- Use guard clauses

### Function Length

| Lines | Severity | Guidance |
|-------|----------|----------|
| <25 | OK | Ideal |
| 25-50 | Suggestion | Consider splitting |
| 50-100 | Important | Should split |
| 100+ | Important | Must split |

**Exceptions:**
- Configuration objects/arrays (long but simple)
- Generated code
- Test setup with many assertions

---

## Naming Patterns

### Generic Names (Avoid)

| Pattern | Example | Problem |
|---------|---------|---------|
| Single letter | `d`, `x`, `t` | No semantic meaning |
| Generic nouns | `data`, `info`, `temp`, `result` | Doesn't describe content |
| Type-as-name | `string`, `array`, `object` | Redundant with type system |
| Abbreviated | `usr`, `cfg`, `mgr` | Reduces readability |

**Exceptions:**
- Loop indices: `i`, `j`, `k` are acceptable
- Lambda parameters: `x => x * 2` for simple transforms
- Coordinates: `x`, `y`, `z` for geometry

### Misleading Names

| Pattern | Example | Problem |
|---------|---------|---------|
| Wrong plurality | `user` for array, `users` for single | Confuses data shape |
| Wrong type hint | `isValid` returning non-boolean | Breaks expectations |
| Outdated name | `tempFix` that's been permanent | Misleading history |
| Wrong scope | `globalUser` that's local | Suggests wrong lifetime |

### Good Naming

| Context | Pattern | Example |
|---------|---------|---------|
| Boolean | `is`, `has`, `can`, `should` prefix | `isActive`, `hasPermission` |
| Function | Verb phrase | `calculateTotal`, `fetchUser` |
| Handler | `handle` or `on` prefix | `handleClick`, `onSubmit` |
| Collection | Plural noun | `users`, `orderItems` |
| Singular | Singular noun | `user`, `currentOrder` |

---

## Structure Patterns

### God Function

A function that does too many things.

**Indicators:**
- Multiple unrelated operations
- Comments separating "phases"
- Many parameters (>5)
- Mixed abstraction levels

**Example:**
```typescript
// GOD FUNCTION - does validation, transformation, persistence, notification
async function processOrder(order: Order) {
  // Validate
  if (!order.items.length) throw new Error('Empty order');
  if (!order.customer) throw new Error('No customer');

  // Calculate totals
  const subtotal = order.items.reduce((sum, i) => sum + i.price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  // Save to database
  await db.orders.insert({ ...order, total });

  // Send notifications
  await email.send(order.customer.email, 'Order confirmed');
  await slack.notify('#orders', `New order: ${order.id}`);

  return { success: true };
}
```

**Remediation:** Extract to `validateOrder`, `calculateTotals`, `saveOrder`, `notifyOrder`.

### Mixed Concerns

| Pattern | Example | Problem |
|---------|---------|---------|
| UI logic in data layer | Formatting in repository | Coupling |
| Business logic in controller | Validation in route handler | Testability |
| Side effects in pure function | Logging in calculator | Unpredictability |

### Duplicate Code

**Detection:**
- Near-identical blocks (>10 lines)
- Copy-paste with minor modifications
- Same pattern repeated 3+ times

**Severity:** Suggestion (unless bugs have diverged)

---

## Control Flow

### Early Return Missing

```typescript
// BEFORE: Deep nesting
function process(user: User) {
  if (user) {
    if (user.active) {
      if (user.verified) {
        return doWork(user);
      }
    }
  }
  return null;
}

// AFTER: Guard clauses
function process(user: User) {
  if (!user) return null;
  if (!user.active) return null;
  if (!user.verified) return null;
  return doWork(user);
}
```

### Complex Conditionals

```typescript
// BEFORE: Hard to understand
if (user.role === 'admin' || (user.role === 'manager' && user.department === 'sales') || user.permissions.includes('override')) {
  // ...
}

// AFTER: Named condition
const canAccess = isAdmin(user) || isSalesManager(user) || hasOverride(user);
if (canAccess) {
  // ...
}
```

---

## Detection Priority

1. **Nesting depth**: Visual inspection, count indent levels
2. **Function length**: Line count
3. **Generic names**: Pattern matching on common words
4. **Complex conditionals**: Count operators in single expression

---

## False Positive Prevention

**Skip these patterns:**
- Intentionally complex algorithms with explanatory comments
- Generated code (migrations, schemas)
- Configuration objects with many properties
- Test files with verbose setup
- Legacy code with explicit TODO/FIXME markers

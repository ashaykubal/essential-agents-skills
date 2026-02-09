# Type Safety Patterns Reference

Patterns for the Type Safety section of code-review skill.

---

## `any` Usage Patterns

### Explicit `any`

| Pattern | Detection | Severity | Example |
|---------|-----------|----------|---------|
| Parameter typed as `any` | `: any` in function signature | Important | `function process(data: any)` |
| Return typed as `any` | `: any` as return type | Important | `function fetch(): any` |
| Variable typed as `any` | `const x: any =` | Important | `const response: any = await fetch()` |
| Generic constraint `any` | `<T extends any>` | Important | Usually unnecessary |

**When `any` is Acceptable:**
- JSON parsing with immediate schema validation
- Third-party library interop with no types
- Type assertions for testing flexibility
- Gradual migration from JavaScript

### Implicit `any`

| Pattern | Detection | Severity | Example |
|---------|-----------|----------|---------|
| Missing parameter type | No type annotation, no inference | Important | `function process(data)` |
| Missing return type | Complex function without explicit return | Suggestion | `function calculate() { ... }` |
| Untyped catch clause | `catch (e)` without type annotation | Suggestion | `catch (error) { console.log(error.message) }` |

**tsconfig Recommendation:**
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Null/Undefined Handling

### Unsafe Patterns

| Pattern | Detection | Severity | Example |
|---------|-----------|----------|---------|
| Non-null assertion abuse | `!` on potentially null values | Important | `user!.name` when user may be null |
| Optional chaining gap | Mixed `?.` and `.` on same chain | Important | `user?.profile.name` (profile may be undefined) |
| Truthy check inadequate | `if (value)` when 0 or "" is valid | Important | `if (count)` when 0 is valid |
| Missing nullish handling | No `?? defaultValue` for optional | Suggestion | `return config.timeout` without fallback |

### Safe Patterns

| Pattern | Example |
|---------|---------|
| Explicit null check | `if (user !== null && user !== undefined)` |
| Optional chaining throughout | `user?.profile?.name` |
| Nullish coalescing | `config.timeout ?? 30000` |
| Type narrowing | `if ('name' in user)` |

---

## Unsafe Type Assertions

### High-Risk Patterns

| Pattern | Detection | Severity | Example |
|---------|-----------|----------|---------|
| Double assertion | `as unknown as T` | Critical | `value as unknown as SpecificType` |
| Widening then narrowing | Cast to `any` then to specific | Critical | `(value as any) as ExpectedType` |
| Non-overlapping assertion | Types share no properties | Important | `string as number` |
| Assertion without validation | Cast external data without checks | Important | `JSON.parse(input) as Config` |

### Safe Assertion Patterns

| Pattern | Example |
|---------|---------|
| Type guard before assertion | `if (isConfig(data)) { return data as Config }` |
| Schema validation | `const config = configSchema.parse(input)` |
| Branded types | `type UserId = string & { readonly brand: unique symbol }` |

---

## Common Bypasses

### Library Interop

```typescript
// SUSPECTED: Library returns any
import { externalLib } from 'untyped-lib';
const result = externalLib.process(data); // any

// RECOMMENDED: Wrap with type
interface ProcessResult { status: string; data: unknown }
const result: ProcessResult = externalLib.process(data);
```

### JSON Parsing

```typescript
// SUSPECTED: Unvalidated JSON
const config = JSON.parse(rawConfig); // any

// RECOMMENDED: Validate immediately
const config = JSON.parse(rawConfig);
if (!isValidConfig(config)) throw new Error('Invalid config');
```

---

## Detection Priority

1. **Explicit `any` annotations**: Direct code search
2. **Type assertions**: Look for `as` keyword
3. **Non-null assertions**: Look for `!` not in conditionals
4. **Implicit any**: Requires type checking context (tsconfig)

---

## False Positive Prevention

**Skip these patterns:**
- `any` in test files for mock flexibility
- `any` with immediate `typeof` or `instanceof` check
- Type assertions in type definition files (.d.ts)
- `unknown` usage (proper unknown handling is safe)
- Assertion in return position with JSDoc validation note

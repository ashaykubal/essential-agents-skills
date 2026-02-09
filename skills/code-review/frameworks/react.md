# React Framework Patterns

Security and quality patterns specific to React applications.

---

## Security Patterns

### XSS Prevention

| Pattern | Risk | Detection |
|---------|------|-----------|
| `dangerouslySetInnerHTML` | High | Direct use without sanitization |
| String interpolation in JSX | Medium | `{userInput}` in href, src attributes |
| `eval()` with props/state | Critical | Dynamic code execution |

**Safe Pattern:**
```tsx
// BAD
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// GOOD
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />

// BETTER
<div>{userComment}</div>  // React escapes by default
```

### URL Injection

| Pattern | Risk | Detection |
|---------|------|-----------|
| `javascript:` in href | Critical | User input in anchor href |
| User-controlled `src` | High | Dynamic image/iframe sources |

**Safe Pattern:**
```tsx
// BAD
<a href={userProvidedUrl}>Link</a>

// GOOD
const sanitizeUrl = (url: string) => {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid URL protocol');
  }
  return url;
};
<a href={sanitizeUrl(userProvidedUrl)}>Link</a>
```

### State Exposure

| Pattern | Risk | Detection |
|---------|------|-----------|
| Secrets in state | Critical | API keys, tokens in useState/Redux |
| PII in localStorage | High | User data persisted client-side |

---

## Type Safety Patterns

### Props Typing

| Pattern | Issue | Fix |
|---------|-------|-----|
| `props: any` | Bypasses type checking | Define interface |
| Missing children type | Unclear component API | Use `React.ReactNode` |
| Event handler `any` | Loses event type | Use specific event type |

**Example:**
```tsx
// BAD
function Button(props: any) {
  return <button onClick={props.onClick}>{props.children}</button>;
}

// GOOD
interface ButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function Button({ onClick, children, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
}
```

### Ref Typing

```tsx
// BAD
const inputRef = useRef(null);  // RefObject<null>

// GOOD
const inputRef = useRef<HTMLInputElement>(null);
```

---

## Linting Patterns

### Component Complexity

| Metric | Threshold | Action |
|--------|-----------|--------|
| Lines per component | >150 | Split into sub-components |
| Props count | >7 | Consider composition or context |
| useEffect dependencies | >4 | Extract custom hook |

### Hook Rules

| Violation | Detection |
|-----------|-----------|
| Conditional hooks | `if (condition) { useEffect(...) }` |
| Loop hooks | `items.map(() => useState(...))` |
| Nested hooks | Hook called inside callback |

---

## Coding Standards

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component | PascalCase | `UserProfile` |
| Hook | camelCase with `use` prefix | `useUserProfile` |
| Handler | `handle` prefix | `handleSubmit` |
| Boolean prop | `is`, `has`, `should` prefix | `isLoading` |

### File Organization

```
components/
  Button/
    Button.tsx          # Component
    Button.test.tsx     # Tests
    Button.module.css   # Styles
    index.ts            # Re-export
```

---

## What to Skip

- Third-party component library patterns
- React DevTools annotations
- Storybook-specific code
- Test utilities using `any` for mock flexibility

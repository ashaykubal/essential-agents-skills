# Express/Node Framework Patterns

Security and quality patterns specific to Express.js and Node.js applications.

---

## Security Patterns

### Injection Attacks

| Pattern | Risk | Detection |
|---------|------|-----------|
| SQL in string concat | Critical | `query + req.body.x` |
| NoSQL operator injection | Critical | `{ $where: userInput }` |
| Command injection | Critical | `exec(userInput)` |
| Path traversal | High | `path.join(base, userInput)` |

**Safe Patterns:**
```typescript
// SQL: Use parameterized queries
const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);

// NoSQL: Sanitize operators
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());

// Commands: Use array form
const { spawn } = require('child_process');
spawn('ls', ['-la', sanitizedPath]);  // Not: exec(`ls -la ${path}`)

// Paths: Validate within allowed directory
const safePath = path.resolve(uploadDir, userFilename);
if (!safePath.startsWith(uploadDir)) throw new Error('Invalid path');
```

### Authentication/Authorization

| Pattern | Risk | Detection |
|---------|------|-----------|
| Missing auth middleware | Critical | Route without `isAuthenticated` |
| JWT in URL | High | Token in query string |
| Weak session config | Medium | Missing secure/httpOnly flags |

**Safe Pattern:**
```typescript
// Middleware chain
router.get('/admin',
  isAuthenticated,    // Verify JWT/session
  requireRole('admin'),  // Check role
  adminController.dashboard
);

// Session config
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,      // HTTPS only
    httpOnly: true,    // No JS access
    sameSite: 'strict' // CSRF protection
  }
}));
```

### Input Validation

| Pattern | Risk | Detection |
|---------|------|-----------|
| Unvalidated body | High | Direct use of req.body |
| Missing sanitization | Medium | No express-validator/joi |
| Type coercion issues | Medium | `req.query.id` used as number |

**Safe Pattern:**
```typescript
import { body, validationResult } from 'express-validator';

router.post('/users',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Proceed with validated data
  }
);
```

### Security Headers

| Header | Purpose | Check |
|--------|---------|-------|
| Content-Security-Policy | XSS prevention | `helmet.contentSecurityPolicy()` |
| X-Frame-Options | Clickjacking prevention | `helmet.frameguard()` |
| Strict-Transport-Security | Force HTTPS | `helmet.hsts()` |

```typescript
import helmet from 'helmet';
app.use(helmet());  // Enables all security headers
```

---

## Type Safety Patterns

### Request Typing

```typescript
// BAD: Untyped request
app.post('/users', (req, res) => {
  const { name, email } = req.body;  // any
});

// GOOD: Typed request
interface CreateUserBody {
  name: string;
  email: string;
}

app.post('/users', (req: Request<{}, {}, CreateUserBody>, res) => {
  const { name, email } = req.body;  // Typed
});
```

### Response Typing

```typescript
// Define response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function sendSuccess<T>(res: Response, data: T): void {
  res.json({ success: true, data } as ApiResponse<T>);
}

function sendError(res: Response, status: number, error: string): void {
  res.status(status).json({ success: false, error } as ApiResponse<never>);
}
```

---

## Error Handling

### Async Error Handling

```typescript
// BAD: Unhandled promise rejection
app.get('/users', async (req, res) => {
  const users = await db.users.findAll();  // If throws, crashes
  res.json(users);
});

// GOOD: Wrapped async handler
const asyncHandler = (fn: RequestHandler) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users', asyncHandler(async (req, res) => {
  const users = await db.users.findAll();
  res.json(users);
}));

// Error middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

---

## Linting Patterns

### Middleware Order

Correct order:
1. Security middleware (helmet, cors)
2. Body parsers
3. Session/auth
4. Routes
5. Error handlers

### Route Organization

```typescript
// routes/users.ts
const router = Router();
router.get('/', userController.list);
router.get('/:id', userController.get);
router.post('/', userController.create);
export default router;

// app.ts
app.use('/api/users', usersRouter);
```

---

## What to Skip

- Development-only middleware (`morgan` in dev mode)
- Test fixtures with intentional vulnerabilities
- Mock servers for testing
- Documentation routes (Swagger)

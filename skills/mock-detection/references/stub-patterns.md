# Stub Patterns Reference

Extended test double detection patterns for mock-detection Stage 2 analysis. Covers the Meszaros test double taxonomy beyond basic `jest.mock()` / `vi.mock()` patterns.

---

## Meszaros Test Double Taxonomy

| Type | Purpose | Detection Priority |
|------|---------|-------------------|
| **Dummy** | Fills parameter lists, never used | Low (rarely harmful) |
| **Stub** | Returns canned answers | Medium (may hide real behavior) |
| **Spy** | Records calls for later verification | Medium (T2 risk if no result check) |
| **Mock** | Pre-programmed expectations | High (T1/T3 risk) |
| **Fake** | Working implementation with shortcuts | Context-dependent |

---

## Naming Convention Patterns

### Direct Name Matches

These naming patterns indicate test doubles. When found in integration tests, evaluate whether they break the integration chain.

| Pattern | Regex | Examples |
|---------|-------|----------|
| `Mock*` | `/^[Mm]ock[A-Z]/` | `MockDatabase`, `mockUserService`, `MockHttpClient` |
| `Stub*` | `/^[Ss]tub[A-Z]/` | `StubRepository`, `stubAuthProvider`, `StubCache` |
| `Fake*` | `/^[Ff]ake[A-Z]/` | `FakeFileSystem`, `fakeEmailSender`, `FakeQueue` |
| `InMemory*` | `/^[Ii]n[Mm]emory[A-Z]/` | `InMemoryDatabase`, `InMemoryCache`, `InMemoryEventBus` |
| `Dummy*` | `/^[Dd]ummy[A-Z]/` | `DummyLogger`, `dummyConfig`, `DummyTransport` |
| `Spy*` | `/^[Ss]py[A-Z]/` | `SpyLogger`, `spyNotifier` |
| `*Builder` | `/[A-Z]\w+Builder$/` | `UserBuilder`, `OrderBuilder`, `ConfigBuilder` |
| `Test*` | `/^[Tt]est[A-Z]/` | `TestServer`, `TestDatabase`, `TestHelper` |

### Counter-Examples (NOT test doubles)

These match naming patterns but are NOT test doubles:

| Name | Why It's Not a Double |
|------|----------------------|
| `mockImplementation()` | Jest API method, not a variable |
| `InMemoryCache` in production code | Real implementation choice, not a test shortcut |
| `TestUtils.formatDate()` | Test utility, not a replacement for production code |
| `buildUser()` in a factory module | Production factory, not test-only builder |
| `stubborn`, `mockingbird` | English words, not test double prefixes |

**Rule**: Match on PascalCase/camelCase boundaries only. `mockUser` matches; `mockingbird` does not.

---

## Class Hierarchy Detection

### Implements/Extends Patterns

Classes that implement interfaces or extend base classes as test replacements:

```typescript
// DETECT: Class implements interface with test-double name
class FakeDatabase implements DatabasePort {
  private data = new Map<string, unknown>();
  async get(key: string) { return this.data.get(key); }
  async set(key: string, value: unknown) { this.data.set(key, value); }
}

// DETECT: Class extends base with override
class StubEmailService extends EmailService {
  override async send() { return { sent: true }; }
}

// DETECT: Abstract test base
class TestRepository<T> implements Repository<T> {
  protected items: T[] = [];
  async findAll() { return this.items; }
}
```

**Detection signals** (AST-level):
1. Class name matches a test double naming pattern (Fake*, Stub*, Mock*, Test*, InMemory*)
2. Class implements an interface OR extends a base class
3. Class defined in a test file or `__tests__/` directory

**Violation evaluation**:
- In unit tests: Generally acceptable (isolating external dependencies)
- In integration tests: Flag if the class replaces an integration boundary the test claims to verify

### Manual Stub Without Naming Convention

Some developers create test doubles without naming conventions:

```typescript
// No Fake/Stub/Mock prefix, but still a test double
const database = {
  query: async () => [{ id: 1, name: 'test' }],
  insert: async () => ({ id: 1 }),
  delete: async () => true,
};

// Replacement object matching an interface shape
const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};
```

**Detection signals**:
1. Object literal assigned to variable with interface-matching shape
2. All methods are no-ops (`() => {}`) or return hardcoded values
3. Variable used where a dependency injection parameter is expected

**Note**: These are harder to detect deterministically. Flag as `confidence: medium` for LLM review.

---

## Factory Function Patterns

### Test Data Factories (Usually Safe)

Factory functions that create test input data are generally NOT violations:

```typescript
// SAFE: Creates input data for the system under test
function createTestUser(overrides = {}) {
  return { id: 'user-1', name: 'Test User', email: 'test@example.com', ...overrides };
}

// SAFE: Builder pattern for test data
const user = new UserBuilder().withName('Alice').withRole('admin').build();

// SAFE: Faker/factory-based generation
const order = OrderFactory.create({ status: 'pending' });
```

**Why safe**: These create *input data*, not *replacement behavior*. The system under test still processes this data through real code paths.

### Test Infrastructure Factories (Context-Dependent)

Factory functions that create test infrastructure need evaluation:

```typescript
// CONTEXT-DEPENDENT: Creates a test server
function createTestServer(routes) {
  const app = express();
  routes.forEach(r => app.get(r.path, r.handler));
  return app.listen(0); // Random port
}

// CONTEXT-DEPENDENT: Creates an in-memory database
function createTestDatabase(seed = []) {
  const db = new Map();
  seed.forEach(item => db.set(item.id, item));
  return { get: (id) => db.get(id), set: (id, v) => db.set(id, v) };
}
```

**Evaluation rule**: If the factory replaces a real dependency that the test claims to verify integration with, it's a violation. If it provides supporting infrastructure (e.g., a test HTTP server to receive real requests), it's acceptable.

### Factory Naming Conventions

| Pattern | Regex | Typically Safe? |
|---------|-------|-----------------|
| `create*` | `/^create[A-Z]/` | Yes (data factory) |
| `build*` | `/^build[A-Z]/` | Yes (builder pattern) |
| `make*` | `/^make[A-Z]/` | Yes (data factory) |
| `generate*` | `/^generate[A-Z]/` | Yes (data factory) |
| `setup*` | `/^setup[A-Z]/` | Evaluate (infrastructure) |
| `createTest*` | `/^createTest[A-Z]/` | Evaluate (test infrastructure) |
| `buildMock*` | `/^buildMock[A-Z]/` | Flag (explicit mock factory) |
| `createFake*` | `/^createFake[A-Z]/` | Flag (explicit fake factory) |

---

## Framework-Specific Patterns

### Jest / Vitest

```typescript
// Already detected by mock-detection core patterns:
jest.mock('./module');
jest.spyOn(object, 'method');
vi.mock('./module');
vi.spyOn(object, 'method');

// Extended patterns (detect via this reference):
jest.fn().mockReturnValue(value);     // Inline mock function
jest.fn().mockResolvedValue(value);   // Async mock
jest.fn().mockImplementation(fn);     // Custom implementation mock
```

### Sinon

```typescript
sinon.stub(object, 'method').returns(value);
sinon.mock(object).expects('method');
sinon.fake.returns(value);
sinon.spy(object, 'method');
```

### Test Containers / Real Infrastructure

```typescript
// NOT a test double - real infrastructure for integration tests
const container = await new GenericContainer('postgres:15').start();
const redis = await new GenericContainer('redis:7').start();

// NOT a test double - real HTTP interception for external APIs
const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => res(ctx.json(users)))
);
```

**Rule**: Test containers and MSW/nock interceptors for *external* APIs are legitimate test infrastructure, not violations. See `false-positive-prevention.md` for the full allowlist.

---

## Detection Priority by Test Type

| Test Type | What to Flag | What to Allow |
|-----------|-------------|---------------|
| **Unit** | T1 (mock SUT), T2 (call-only assert) | External dep mocks, data factories |
| **Integration** | T3 (mock boundary), T3+ (broken chain), manual stubs replacing integration points | Data factories, test containers, external API mocks |
| **E2E** | Any mock/stub/fake that shortcuts the flow | Seed data, test user factories |

---

## Summary for LLM Agent

When analyzing a test file:

1. **Scan for naming patterns** from the tables above
2. **Check class hierarchies** for implements/extends with test-double names
3. **Identify factory functions** and classify as data factory (safe) vs infrastructure factory (evaluate)
4. **Cross-reference with test type** (unit vs integration vs E2E)
5. **Apply the mock appropriateness rubric** from mock-detection SKILL.md
6. **Consult false-positive-prevention.md** before flagging borderline patterns

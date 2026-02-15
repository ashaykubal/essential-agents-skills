# False Positive Prevention Reference

Two-tier allowlist and decision tree for mock-detection Stage 2 analysis. Prevents flagging legitimate test patterns as T1-T4 violations.

---

## Tier 1: Universal Safe (Never Flag)

These patterns are safe regardless of test type. Do not flag as violations.

### Test Framework Primitives

| Pattern | Why Safe |
|---------|----------|
| `describe()`, `it()`, `test()` | Test structure, not test doubles |
| `beforeEach()`, `afterEach()` | Lifecycle hooks |
| `beforeAll()`, `afterAll()` | Suite-level setup/teardown |
| `expect()`, `assert()` | Assertion primitives |
| `jest.setTimeout()`, `vi.setConfig()` | Framework configuration |
| `jest.useFakeTimers()` | Timer control (not mocking SUT) |
| `jest.clearAllMocks()` | Cleanup utility |

### Test Data Construction

| Pattern | Why Safe |
|---------|----------|
| `*Builder` classes | Construct input data, not replacement behavior |
| `*Factory` functions | `UserFactory.create()`, `OrderFactory.build()` |
| `create*()` data factories | `createTestUser()`, `createSampleOrder()` |
| `build*()` data factories | `buildConfig()`, `buildPayload()` |
| `make*()` data factories | `makeUser()`, `makeRequest()` |
| `generate*()` data factories | `generateToken()`, `generateId()` |
| Faker/Chance libraries | `faker.person.fullName()`, `chance.email()` |
| Literal test data | `const input = { name: 'Alice', age: 30 }` in unit tests |

### Assertion Utilities

| Pattern | Why Safe |
|---------|----------|
| Custom matchers | `expect.extend({ toBeValidEmail })` |
| Snapshot utilities | `expect(result).toMatchSnapshot()` |
| `supertest` / `pactum` | HTTP assertion libraries (test real endpoints) |
| `testing-library` queries | `screen.getByText()`, `render()` |

### Logging and Instrumentation

| Pattern | Why Safe |
|---------|----------|
| Test loggers | `const logger = createTestLogger()` — observability, not behavior replacement |
| Console suppression | `jest.spyOn(console, 'error').mockImplementation(() => {})` — noise reduction |
| Performance timers | `performance.mark()`, `performance.measure()` |

**Exception for console suppression**: If a test asserts on console output (e.g., `expect(console.error).toHaveBeenCalledWith('specific message')`), this becomes a T2 pattern. Flag only if there is no accompanying result assertion.

---

## Tier 2: Context-Dependent (Check Test Type)

These patterns require evaluating the test type before deciding.

### HTTP Interception (nock / MSW)

```typescript
// MSW setup
const server = setupServer(
  rest.get('https://api.external.com/users', (req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: 'Alice' }]));
  })
);
```

| Test Type | Verdict | Rationale |
|-----------|---------|-----------|
| Unit test | Safe | Isolating external HTTP is expected |
| Integration test (external API) | Safe | Mocking third-party APIs you don't control is acceptable |
| Integration test (own services) | **Flag T3** | Mocking your own service boundaries defeats integration testing |
| E2E test | **Flag** | E2E should hit real endpoints |

**Decision rule**: Check the intercepted URL. If it points to an external third-party service, safe. If it points to the application's own API or internal services, flag.

### InMemory* Fakes

```typescript
class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();
  async findById(id: string) { return this.users.get(id); }
  async save(user: User) { this.users.set(user.id, user); }
}
```

| Test Type | Verdict | Rationale |
|-----------|---------|-----------|
| Unit test | Safe | Isolating persistence for unit logic is expected |
| Integration test (repo layer) | **Flag T3** | If testing repository integration, use real database |
| Integration test (service layer) | Context-dependent | OK if repo isn't the boundary under test |

**Decision rule**: Is the InMemory replacement sitting at the integration boundary the test claims to verify? If yes, flag. If it's a supporting dependency not under test, safe.

### Dependency Injection Test Doubles

```typescript
// Test provides a mock via DI
const service = new OrderService(mockPaymentGateway, mockInventory);
```

| Test Type | Verdict | Rationale |
|-----------|---------|-----------|
| Unit test | Safe | DI-based isolation is textbook unit testing |
| Integration test | **Evaluate** | Which dependencies are mocked? Are they the integration boundaries? |
| E2E test | **Flag** | DI should use real implementations |

**Decision rule**: In integration tests, flag DI mocks only for the specific boundaries the test claims to integrate. Supporting dependencies that aren't part of the integration scope are acceptable.

### Test Containers

```typescript
const pgContainer = await new PostgreSqlContainer().start();
const redisContainer = await new GenericContainer('redis:7').start();
```

| Test Type | Verdict | Rationale |
|-----------|---------|-----------|
| All types | **Always safe** | Real infrastructure, not a test double |

### Environment/Config Overrides

```typescript
process.env.DATABASE_URL = 'postgres://localhost:5432/test';
process.env.API_KEY = 'test-key-not-real';
```

| Test Type | Verdict | Rationale |
|-----------|---------|-----------|
| All types | Safe | Configuration, not behavior replacement |

---

## Decision Tree

Use this tree to evaluate whether a detected pattern is a violation.

```
Is it a test framework primitive or assertion utility?
  YES -> SAFE (Tier 1)
  NO  -> continue

Is it test data construction (factory, builder, literal)?
  YES -> SAFE (Tier 1)
  NO  -> continue

Is it a test container or real infrastructure?
  YES -> SAFE (Tier 1)
  NO  -> continue

Is it console/logging suppression without assertion on output?
  YES -> SAFE (Tier 1)
  NO  -> continue

--- Beyond this point: context-dependent (Tier 2) ---

Identify the TEST TYPE (unit / integration / E2E):
  - File name contains `.unit.` or is in `__tests__/unit/` -> UNIT
  - File name contains `.integration.` or `.int.` -> INTEGRATION
  - File name contains `.e2e.` or `.spec.` with E2E markers -> E2E
  - Otherwise -> infer from test content (imports, setup patterns)

Is it HTTP interception (nock, MSW, fetch mock)?
  UNIT test        -> SAFE
  INTEGRATION test -> Is the intercepted URL your own service?
    YES -> FLAG T3 (mocking own integration boundary)
    NO  -> SAFE (external API mock is acceptable)
  E2E test         -> FLAG

Is it an InMemory*/Fake* class?
  UNIT test        -> SAFE
  INTEGRATION test -> Does it replace the boundary under test?
    YES -> FLAG T3
    NO  -> SAFE (supporting dependency)
  E2E test         -> FLAG

Is it a DI-injected mock?
  UNIT test        -> SAFE
  INTEGRATION test -> Is the mocked dependency an integration boundary?
    YES -> FLAG T3
    NO  -> SAFE
  E2E test         -> FLAG

Is it jest.mock()/vi.mock() on a module?
  Does it mock the module under test?
    YES -> FLAG T1 (mocking SUT)
    NO  -> Is this an integration test mocking an integration boundary?
      YES -> FLAG T3
      NO  -> SAFE (isolating irrelevant dependency)

None of the above matched?
  -> FLAG as confidence: medium, recommend manual review
```

---

## Decision Tree (YAML Encoding)

For structured consumption by the detection agent:

```yaml
decision_tree:
  - check: "test_framework_primitive"
    description: "describe/it/test/expect/beforeEach/afterEach/beforeAll/afterAll"
    verdict: safe
    tier: 1

  - check: "test_data_construction"
    description: "*Builder, *Factory, create*/build*/make*/generate*, faker, literal input data"
    verdict: safe
    tier: 1

  - check: "test_container_or_real_infra"
    description: "testcontainers, real database connections, real servers"
    verdict: safe
    tier: 1

  - check: "console_logging_suppression"
    description: "jest.spyOn(console, ...) without assertion on output"
    verdict: safe
    tier: 1

  - check: "http_interception"
    description: "nock, MSW, jest.mock('node-fetch')"
    conditions:
      - test_type: unit
        verdict: safe
      - test_type: integration
        sub_check: "intercepted URL is own service?"
        if_yes: "flag_T3"
        if_no: "safe"
      - test_type: e2e
        verdict: flag

  - check: "inmemory_fake_class"
    description: "InMemory*, Fake* implements Interface"
    conditions:
      - test_type: unit
        verdict: safe
      - test_type: integration
        sub_check: "replaces boundary under test?"
        if_yes: "flag_T3"
        if_no: "safe"
      - test_type: e2e
        verdict: flag

  - check: "di_injected_mock"
    description: "new Service(mockDep, fakeDep)"
    conditions:
      - test_type: unit
        verdict: safe
      - test_type: integration
        sub_check: "mocked dep is integration boundary?"
        if_yes: "flag_T3"
        if_no: "safe"
      - test_type: e2e
        verdict: flag

  - check: "module_mock"
    description: "jest.mock('./module'), vi.mock('./module')"
    conditions:
      - sub_check: "mocks module under test?"
        if_yes: "flag_T1"
        if_no:
          sub_check: "integration test mocking boundary?"
          if_yes: "flag_T3"
          if_no: "safe"

  - check: "unmatched_pattern"
    description: "Pattern not covered by above rules"
    verdict: "flag_medium_confidence"
    note: "Recommend manual review"
```

---

## Common False Positive Scenarios

These patterns have been observed to trigger false positives. The detection agent should recognize and skip them.

### 1. Supertest / Pactum Request Chains

```typescript
// NOT a violation - supertest creates real HTTP requests to real server
const response = await request(app)
  .get('/api/users')
  .expect(200)
  .expect('Content-Type', /json/);
```

**Why flagged incorrectly**: `request(app)` looks like it might be wrapping the app in a test double. It's actually creating a real HTTP connection.

### 2. React Testing Library Render

```typescript
// NOT a violation - renders real component in real DOM
const { getByText, getByRole } = render(<LoginForm onSubmit={mockSubmit} />);
```

**Why flagged incorrectly**: `render()` might look like it creates a fake DOM. It uses jsdom, which is real DOM behavior. The `mockSubmit` callback is an acceptable mock for a unit test.

### 3. Timer Mocking

```typescript
jest.useFakeTimers();
// ... test code ...
jest.advanceTimersByTime(1000);
```

**Why flagged incorrectly**: "Fake" in the method name. Timer mocking is framework-supported test control, not SUT mocking.

### 4. Module Re-exports in Test Utilities

```typescript
// test-utils.ts
export { render, screen } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
export const testDb = createTestDatabase();
```

**Why flagged incorrectly**: Test utility file might look like a mock factory. It's re-exporting real libraries.

### 5. Snapshot Testing

```typescript
expect(component).toMatchInlineSnapshot(`
  <div class="user-card">
    <span>Alice</span>
  </div>
`);
```

**Why flagged incorrectly**: Inline snapshots contain hardcoded HTML that might look like manually constructed test data. Snapshots verify real output.

---

## Worked Example: Mixed-Type File

A single test file may contain both unit and integration sections. The **same mock pattern** can be safe or a violation depending on which section it appears in.

### Scenario

`error-handler.test.ts` contains:
- **Lines 1-100**: Unit tests for `categorizeError`, `calculateBackoff`, `withRetry`, `ErrorHandlerService`
- **Lines 105-150**: Integration tests under `describe('Error Handling Integration', ...)`

### The Pattern: `jest.fn().mockResolvedValue()`

**In the unit section (SAFE — no violation):**
```typescript
describe('Retry Mechanism', () => {
  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    const result = await withRetry(operation, { maxAttempts: 3 });
    expect(result).toBe('success');
  });
});
```
- `operation` is an **injected dependency** (callback parameter to `withRetry`)
- The SUT is `withRetry`, not `operation`
- Mocking injected deps in unit tests is appropriate
- **Verdict: SAFE** (Tier 1 Universal Safe — injected dependency in unit test)

**In the integration section (T3 VIOLATION):**
```typescript
describe('Error Handling Integration', () => {
  it('should handle transient errors with retry and recovery', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValue({ data: 'recovered' });
    const result = await service.executeWithRetry(operation, { maxAttempts: 3 });
    expect(result).toEqual({ data: 'recovered' });
  });
});
```
- `operation` is the **integration boundary** — the external system call
- Integration tests exist to verify real system interactions
- Mocking the boundary defeats the purpose of the integration test
- **Verdict: T3 VIOLATION** (Mock at integration boundary)

### Key Takeaway

Never classify an entire file as one test type. Evaluate each describe block independently against the rubric for **its** test type.

If AST integration-mock metadata is available (from `npx tsx skills/test-audit/scripts/integration-mock-detector.ts`), it provides ground truth for section boundaries and mock locations within integration/e2e blocks.

---

## Summary for LLM Agent

When evaluating a potential violation:

1. **Check Tier 1 first** — if the pattern matches Universal Safe, skip immediately
2. **Identify test type** — unit, integration, or E2E (file name, directory, or content)
3. **Walk the decision tree** for Tier 2 patterns — context determines the verdict
4. **When uncertain**, flag as `confidence: medium` with a note explaining the ambiguity
5. **Never flag** test data factories, test containers, or framework primitives
6. **Always flag** mocking the system under test (T1) regardless of test type

# Pattern 6: External API Verification

## Strategy

Use MSW (Mock Service Worker) to intercept at network level - not module level.
This allows real HTTP calls while controlling external responses.

---

## Template (Node/Jest with MSW)

```javascript
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { fetchUserData, postOrder } from '{component_path}';

// Setup MSW server with handlers
const server = setupServer(
  rest.get('https://api.example.com/users/:id', (req, res, ctx) => {
    return res(ctx.json({
      id: req.params.id,
      name: 'Test User',
      email: 'test@example.com'
    }));
  }),
  rest.post('https://api.example.com/orders', async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.json({
      orderId: 'ORD-123',
      items: body.items,
      status: 'created'
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('{component_name} External API', () => {
  test('fetches user data from API', async () => {
    // Real fetch call - intercepted by MSW at network level
    const user = await fetchUserData(1);

    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
  });

  test('posts order to API', async () => {
    const order = await postOrder({ items: [{ sku: 'ABC', qty: 2 }] });

    expect(order.orderId).toBe('ORD-123');
    expect(order.status).toBe('created');
  });

  test('handles API errors gracefully', async () => {
    // Override handler for this test
    server.use(
      rest.get('https://api.example.com/users/:id', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    await expect(fetchUserData(1)).rejects.toThrow('API error');
  });
});
```

---

## Template (Python/pytest with responses)

```python
import pytest
import responses
from {module} import fetch_user_data, post_order

@responses.activate
def test_fetches_user_data():
    responses.add(
        responses.GET,
        'https://api.example.com/users/1',
        json={'id': 1, 'name': 'Test User', 'email': 'test@example.com'},
        status=200
    )

    user = fetch_user_data(1)

    assert user['name'] == 'Test User'
    assert user['email'] == 'test@example.com'

@responses.activate
def test_posts_order():
    responses.add(
        responses.POST,
        'https://api.example.com/orders',
        json={'orderId': 'ORD-123', 'status': 'created'},
        status=201
    )

    order = post_order({'items': [{'sku': 'ABC', 'qty': 2}]})

    assert order['orderId'] == 'ORD-123'
    assert order['status'] == 'created'

@responses.activate
def test_handles_api_errors():
    responses.add(
        responses.GET,
        'https://api.example.com/users/1',
        json={'error': 'Server error'},
        status=500
    )

    with pytest.raises(Exception) as exc:
        fetch_user_data(1)
    assert 'API error' in str(exc.value)
```

---

## Key Difference from jest.mock

| Approach | What Happens | Real HTTP? |
|----------|--------------|------------|
| `jest.mock('node-fetch')` | Replaces module entirely | No |
| MSW / responses | Intercepts at network layer | Yes (intercepted before leaving machine) |

MSW allows real `fetch()` calls to execute, testing the actual HTTP code path while still controlling external responses.

---

## Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{component_name}` | Name of the API client component |
| `{component_path}` | Import path to the API module |
| `{module}` | Python module name |

# Pattern 2: HTTP Server Verification

## Strategy

Start server, wait for ready, make HTTP requests, verify responses, cleanup.

---

## Template (Bash)

```bash
#!/bin/bash
# HTTP Server Verification: {component_name}
set -e

echo "=== HTTP Server Verification: {component_name} ==="

# Start server in background
{start_command} &
SERVER_PID=$!
echo "Started server (PID: $SERVER_PID)"

# Cleanup trap
cleanup() {
  echo "Cleaning up..."
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT

# Wait for server to be ready
echo -n "Waiting for server... "
for i in {1..30}; do
  if curl -s http://localhost:{port}/health > /dev/null 2>&1; then
    echo "ready"
    break
  fi
  sleep 0.5
done

# Test 1: Health endpoint
echo -n "Test 1: Health endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:{port}/health)
if [ "$HTTP_CODE" = "200" ]; then
  echo "PASS (HTTP 200)"
else
  echo "FAIL (HTTP $HTTP_CODE)"
  exit 1
fi

# Test 2: API endpoint response
echo -n "Test 2: API response... "
RESPONSE=$(curl -s http://localhost:{port}{endpoint})
if echo "$RESPONSE" | jq -e '{json_validation}' > /dev/null 2>&1; then
  echo "PASS (valid response)"
else
  echo "FAIL (invalid response)"
  echo "Response was: $RESPONSE"
  exit 1
fi

# Test 3: 404 handling
echo -n "Test 3: 404 handling... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:{port}/nonexistent)
if [ "$HTTP_CODE" = "404" ]; then
  echo "PASS (HTTP 404)"
else
  echo "FAIL (HTTP $HTTP_CODE, expected 404)"
  exit 1
fi

echo "=== All tests passed ==="
```

---

## Template (Node/Jest with Supertest)

```javascript
const request = require('supertest');
const { createServer } = require('{component_path}');

describe('{component_name} HTTP Server', () => {
  let server;

  beforeAll(async () => {
    server = await createServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test('health endpoint returns 200', async () => {
    const response = await request(server).get('/health');
    expect(response.status).toBe(200);
  });

  test('API endpoint returns valid data', async () => {
    const response = await request(server).get('{endpoint}');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('{expected_field}');
  });

  test('handles 404 gracefully', async () => {
    const response = await request(server).get('/nonexistent');
    expect(response.status).toBe(404);
  });
});
```

---

## Template (Python/pytest)

```python
import pytest
import requests
import subprocess
import time

@pytest.fixture(scope='module')
def server():
    proc = subprocess.Popen(['{start_command}'])
    # Wait for server to start
    for _ in range(30):
        try:
            requests.get('http://localhost:{port}/health')
            break
        except requests.ConnectionError:
            time.sleep(0.5)
    yield 'http://localhost:{port}'
    proc.terminate()
    proc.wait()

def test_health_endpoint(server):
    response = requests.get(f'{server}/health')
    assert response.status_code == 200

def test_api_endpoint(server):
    response = requests.get(f'{server}{endpoint}')
    assert response.status_code == 200
    assert '{expected_field}' in response.json()

def test_404_handling(server):
    response = requests.get(f'{server}/nonexistent')
    assert response.status_code == 404
```

---

## Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{component_name}` | Name of the HTTP server component |
| `{component_path}` | Import path to the server module |
| `{start_command}` | Command to start the server |
| `{port}` | Port the server listens on |
| `{endpoint}` | API endpoint to test |
| `{expected_field}` | Field expected in JSON response |
| `{json_validation}` | jq expression for JSON validation |

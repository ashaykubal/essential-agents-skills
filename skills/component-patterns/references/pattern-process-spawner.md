# Pattern 4: Process Spawner Verification

## Strategy

Spawn process, verify it's running (check port/pid), verify behavior, cleanup.

---

## Template (Bash)

```bash
#!/bin/bash
# Process Spawner Verification: {component_name}
set -e

echo "=== Process Spawner Verification: {component_name} ==="

# Spawn process
{spawn_command} &
PROC_PID=$!
echo "Spawned process (PID: $PROC_PID)"

# Cleanup trap
cleanup() {
  echo "Cleaning up..."
  kill $PROC_PID 2>/dev/null || true
  wait $PROC_PID 2>/dev/null || true
}
trap cleanup EXIT

sleep 2  # Wait for startup

# Test 1: Process is running
echo -n "Test 1: Process running... "
if kill -0 $PROC_PID 2>/dev/null; then
  echo "PASS (PID $PROC_PID alive)"
else
  echo "FAIL (process not running)"
  exit 1
fi

# Test 2: Port is open (if applicable)
echo -n "Test 2: Port {port} open... "
if nc -z localhost {port} 2>/dev/null; then
  echo "PASS"
else
  echo "FAIL"
  exit 1
fi

# Test 3: Process responds correctly
echo -n "Test 3: Process responds... "
RESPONSE=$({verification_command})
if echo "$RESPONSE" | grep -q "{expected_pattern}"; then
  echo "PASS"
else
  echo "FAIL (expected pattern: {expected_pattern}, got: $RESPONSE)"
  exit 1
fi

echo "=== All tests passed ==="
```

---

## Template (Node/Jest)

```javascript
const { spawn, execSync } = require('child_process');
const net = require('net');

function waitForPort(port, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(100);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) reject(new Error('Timeout'));
        else setTimeout(check, 100);
      });
      socket.connect(port, 'localhost');
    };
    check();
  });
}

describe('{component_name} Process', () => {
  let proc;

  beforeAll(async () => {
    proc = spawn('{spawn_command}', [], { detached: true });
    await waitForPort({port});
  });

  afterAll(() => {
    if (proc) {
      process.kill(-proc.pid);
    }
  });

  test('process is running', () => {
    expect(proc.pid).toBeDefined();
    expect(() => process.kill(proc.pid, 0)).not.toThrow();
  });

  test('port is open', async () => {
    await expect(waitForPort({port}, 1000)).resolves.toBe(true);
  });

  test('responds correctly', () => {
    const output = execSync('{verification_command}', { encoding: 'utf8' });
    expect(output).toContain('{expected_pattern}');
  });
});
```

---

## Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{component_name}` | Name of the process spawner component |
| `{spawn_command}` | Command to spawn the process |
| `{port}` | Port the process listens on (if applicable) |
| `{verification_command}` | Command to verify process behavior |
| `{expected_pattern}` | Expected pattern in response |

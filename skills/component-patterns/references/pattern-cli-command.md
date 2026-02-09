# Pattern 1: CLI Command Verification

## Strategy

Spawn the CLI as a child process, capture stdout/stderr, verify exit code and output.

---

## Template (Bash)

```bash
#!/bin/bash
# CLI Verification: {component_name}
set -e

echo "=== CLI Verification: {component_name} ==="

# Test 1: Basic invocation
echo -n "Test 1: Basic invocation... "
OUTPUT=$({cli_command} {args} 2>&1)
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "PASS (exit code 0)"
else
  echo "FAIL (exit code $EXIT_CODE)"
  exit 1
fi

# Test 2: Output contains expected text
echo -n "Test 2: Output validation... "
if echo "$OUTPUT" | grep -q "{expected_text}"; then
  echo "PASS (found expected text)"
else
  echo "FAIL (missing expected text)"
  echo "Output was: $OUTPUT"
  exit 1
fi

# Test 3: Error handling
echo -n "Test 3: Error handling... "
ERROR_OUTPUT=$({cli_command} --invalid-flag 2>&1) || true
if echo "$ERROR_OUTPUT" | grep -qi "error\|usage\|invalid"; then
  echo "PASS (error message shown)"
else
  echo "FAIL (no error message)"
  exit 1
fi

echo "=== All tests passed ==="
```

---

## Template (Node/Jest)

```javascript
const { execSync, spawn } = require('child_process');

describe('{component_name} CLI', () => {
  test('basic invocation succeeds', () => {
    const output = execSync('{cli_command} {args}', { encoding: 'utf8' });
    expect(output).toContain('{expected_text}');
  });

  test('returns correct exit code on success', (done) => {
    const result = spawn('{cli_command}', ['{args}']);
    result.on('close', (code) => {
      expect(code).toBe(0);
      done();
    });
  });

  test('shows error on invalid input', () => {
    expect(() => {
      execSync('{cli_command} --invalid', { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });
});
```

---

## Template (Python/pytest)

```python
import subprocess
import pytest

class TestCLI:
    def test_basic_invocation(self):
        result = subprocess.run(
            ['{cli_command}', '{args}'],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0
        assert '{expected_text}' in result.stdout

    def test_error_handling(self):
        result = subprocess.run(
            ['{cli_command}', '--invalid-flag'],
            capture_output=True,
            text=True
        )
        assert result.returncode != 0
        assert 'error' in result.stderr.lower() or 'usage' in result.stderr.lower()
```

---

## Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{component_name}` | Name of the CLI component being tested |
| `{cli_command}` | The CLI command to execute |
| `{args}` | Command arguments |
| `{expected_text}` | Text expected in output |

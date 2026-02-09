# Pattern 3: File Parser Verification

## Strategy

Create test input file, run parser, verify parsed output structure and values.

---

## Template (Bash)

```bash
#!/bin/bash
# File Parser Verification: {component_name}
set -e

echo "=== File Parser Verification: {component_name} ==="

# Create test input
TEST_FILE=$(mktemp --suffix=.{ext})
cat > "$TEST_FILE" << 'EOF'
{test_input_content}
EOF

# Cleanup trap
cleanup() {
  rm -f "$TEST_FILE"
}
trap cleanup EXIT

# Test 1: Parse succeeds
echo -n "Test 1: Parse succeeds... "
OUTPUT=$({parser_command} "$TEST_FILE" 2>&1)
if [ $? -eq 0 ]; then
  echo "PASS"
else
  echo "FAIL"
  exit 1
fi

# Test 2: Output structure valid
echo -n "Test 2: Output structure... "
if echo "$OUTPUT" | jq -e '{json_structure_check}' > /dev/null 2>&1; then
  echo "PASS"
else
  echo "FAIL"
  echo "Output was: $OUTPUT"
  exit 1
fi

# Test 3: Values correct
echo -n "Test 3: Values correct... "
VALUE=$(echo "$OUTPUT" | jq -r '{value_path}')
if [ "$VALUE" = "{expected_value}" ]; then
  echo "PASS"
else
  echo "FAIL (expected: {expected_value}, got: $VALUE)"
  exit 1
fi

# Test 4: Invalid input handling
echo -n "Test 4: Invalid input handling... "
if ! {parser_command} "/nonexistent/file.{ext}" 2>&1; then
  echo "PASS (error returned)"
else
  echo "FAIL (should have errored)"
  exit 1
fi

echo "=== All tests passed ==="
```

---

## Template (Node/Jest)

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parse } = require('{component_path}');

describe('{component_name} Parser', () => {
  let testFile;

  beforeAll(() => {
    testFile = path.join(os.tmpdir(), 'test-input.{ext}');
    fs.writeFileSync(testFile, `{test_input_content}`);
  });

  afterAll(() => {
    fs.unlinkSync(testFile);
  });

  test('parses valid input', () => {
    const result = parse(testFile);
    expect(result).toBeDefined();
  });

  test('output has expected structure', () => {
    const result = parse(testFile);
    expect(result).toHaveProperty('{expected_field}');
  });

  test('values are correct', () => {
    const result = parse(testFile);
    expect(result.{field}).toBe('{expected_value}');
  });

  test('handles invalid input', () => {
    expect(() => parse('/nonexistent/file.{ext}')).toThrow();
  });
});
```

---

## Template (Python/pytest)

```python
import pytest
import tempfile
import os
from {module} import {parser_function}

@pytest.fixture
def test_file():
    fd, path = tempfile.mkstemp(suffix='.{ext}')
    with os.fdopen(fd, 'w') as f:
        f.write('''{test_input_content}''')
    yield path
    os.unlink(path)

def test_parse_succeeds(test_file):
    result = {parser_function}(test_file)
    assert result is not None

def test_output_structure(test_file):
    result = {parser_function}(test_file)
    assert '{expected_field}' in result

def test_values_correct(test_file):
    result = {parser_function}(test_file)
    assert result['{field}'] == '{expected_value}'

def test_handles_invalid_input():
    with pytest.raises({ExpectedException}):
        {parser_function}('/nonexistent/file.{ext}')
```

---

## Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{component_name}` | Name of the parser component |
| `{component_path}` | Import path to the parser module |
| `{module}` | Python module name |
| `{parser_function}` | Name of the parse function |
| `{parser_command}` | CLI command to run parser |
| `{ext}` | File extension (e.g., json, yaml, csv) |
| `{test_input_content}` | Sample input content |
| `{expected_field}` | Field expected in parsed result |
| `{field}` | Specific field to check value |
| `{expected_value}` | Expected value of field |
| `{json_structure_check}` | jq expression for structure check |
| `{value_path}` | jq path to specific value |
| `{ExpectedException}` | Python exception class for errors |

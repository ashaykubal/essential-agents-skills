# Pattern 5: Database Verification

## Strategy

Setup test database, execute operations, verify state changes, teardown.

---

## Template (Node/Jest)

```javascript
const { setupTestDb, teardownTestDb } = require('./test-utils');
const { saveRecord, findRecord, deleteRecord } = require('{component_path}');

describe('{component_name} Database Operations', () => {
  let db;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb(db);
  });

  beforeEach(async () => {
    await db.clear();  // Clean state between tests
  });

  test('save creates record in database', async () => {
    const data = { id: 1, value: 'test' };
    await saveRecord(db, data);

    const found = await db.findOne({ id: 1 });
    expect(found).toBeDefined();
    expect(found.value).toBe('test');
  });

  test('find retrieves existing record', async () => {
    await db.insert({ id: 2, value: 'existing' });

    const result = await findRecord(db, 2);
    expect(result.value).toBe('existing');
  });

  test('delete removes record from database', async () => {
    await db.insert({ id: 3, value: 'to-delete' });

    await deleteRecord(db, 3);

    const found = await db.findOne({ id: 3 });
    expect(found).toBeNull();
  });
});
```

---

## Template (Python/pytest)

```python
import pytest
from {module} import save_record, find_record, delete_record

@pytest.fixture
def test_db():
    db = setup_test_database()
    yield db
    teardown_test_database(db)

@pytest.fixture(autouse=True)
def clean_db(test_db):
    yield
    test_db.clear()

def test_save_creates_record(test_db):
    save_record(test_db, {'id': 1, 'value': 'test'})

    found = test_db.find_one({'id': 1})
    assert found is not None
    assert found['value'] == 'test'

def test_find_retrieves_record(test_db):
    test_db.insert({'id': 2, 'value': 'existing'})

    result = find_record(test_db, 2)
    assert result['value'] == 'existing'

def test_delete_removes_record(test_db):
    test_db.insert({'id': 3, 'value': 'to-delete'})

    delete_record(test_db, 3)

    found = test_db.find_one({'id': 3})
    assert found is None
```

---

## Template (Bash - SQLite)

```bash
#!/bin/bash
# Database Verification: {component_name}
set -e

echo "=== Database Verification: {component_name} ==="

TEST_DB=$(mktemp --suffix=.db)

cleanup() {
  rm -f "$TEST_DB"
}
trap cleanup EXIT

# Initialize test database
sqlite3 "$TEST_DB" "CREATE TABLE {table} (id INTEGER PRIMARY KEY, value TEXT);"

# Test 1: Insert
echo -n "Test 1: Insert record... "
{insert_command} "$TEST_DB"
COUNT=$(sqlite3 "$TEST_DB" "SELECT COUNT(*) FROM {table};")
if [ "$COUNT" -gt 0 ]; then
  echo "PASS ($COUNT records)"
else
  echo "FAIL (no records inserted)"
  exit 1
fi

# Test 2: Query
echo -n "Test 2: Query record... "
VALUE=$(sqlite3 "$TEST_DB" "SELECT value FROM {table} WHERE id=1;")
if [ "$VALUE" = "{expected_value}" ]; then
  echo "PASS"
else
  echo "FAIL (expected: {expected_value}, got: $VALUE)"
  exit 1
fi

# Test 3: Delete
echo -n "Test 3: Delete record... "
{delete_command} "$TEST_DB"
COUNT=$(sqlite3 "$TEST_DB" "SELECT COUNT(*) FROM {table};")
if [ "$COUNT" -eq 0 ]; then
  echo "PASS (deleted)"
else
  echo "FAIL ($COUNT records remain)"
  exit 1
fi

echo "=== All tests passed ==="
```

---

## Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{component_name}` | Name of the database component |
| `{component_path}` | Import path to the database module |
| `{module}` | Python module name |
| `{table}` | Database table name |
| `{insert_command}` | Command to insert records |
| `{delete_command}` | Command to delete records |
| `{expected_value}` | Expected value after operations |

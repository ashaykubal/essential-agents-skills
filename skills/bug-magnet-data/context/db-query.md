# Database Query Context

Edge case guidance for testing database operations.

## Applicable Categories

| Category | Priority | Why |
|----------|----------|-----|
| strings/boundaries | T0 | Empty strings, long strings |
| strings/injection | T0 | SQL injection (if raw queries) |
| numbers/boundaries | T0 | Integer limits, ID values |
| booleans/boundaries | T0 | NULL handling |
| dates/boundaries | T1 | Date range queries |
| dates/timezone | T2 | Timezone-aware date storage |

## When to SKIP SQL Injection

| Scenario | Skip? | Why |
|----------|-------|-----|
| Using ORM with parameterized queries | Yes | ORM handles escaping |
| Raw SQL with string concatenation | No | Test thoroughly |
| Stored procedures with parameters | Maybe | Check parameter handling |
| Dynamic table/column names | No | These can't be parameterized |

## Key Edge Cases

### NULL Handling
```sql
-- NULL in WHERE
WHERE column = NULL  -- Never matches! Use IS NULL

-- NULL in comparisons
WHERE column > NULL  -- Always NULL (unknown)

-- NULL in aggregates
SELECT AVG(price)  -- Excludes NULLs

-- COALESCE edge cases
COALESCE(NULL, NULL, 'default')
```

### String Edge Cases
```sql
-- Empty string vs NULL (database dependent)
INSERT INTO t (col) VALUES ('')  -- Oracle: becomes NULL

-- Unicode
INSERT INTO t (name) VALUES ('José 😀')

-- Very long strings
INSERT INTO t (col) VALUES (/* 10000 char string */)

-- Quotes in data (parameterized handles this)
INSERT INTO t (col) VALUES ('O''Brien')
```

### Numeric Edge Cases
```sql
-- ID boundaries
SELECT * FROM t WHERE id = 0
SELECT * FROM t WHERE id = -1
SELECT * FROM t WHERE id = 2147483647  -- INT_MAX

-- Division by zero
SELECT amount / quantity FROM orders  -- What if quantity = 0?

-- Precision
INSERT INTO t (price) VALUES (0.1 + 0.2)  -- Floating point
```

### Date Edge Cases
```sql
-- Epoch
WHERE created_at = '1970-01-01'

-- Y2K38
WHERE expires_at > '2038-01-19 03:14:07'

-- Timezone
WHERE created_at = '2024-03-10 02:30:00'  -- DST gap
```

### Query Result Edge Cases
```sql
-- No results
SELECT * FROM empty_table

-- One result
SELECT * FROM t LIMIT 1

-- Many results (pagination, memory)
SELECT * FROM million_row_table

-- Duplicate keys
INSERT INTO t (id) VALUES (existing_id)
```

## Consumer Usage

When test-audit checks database test coverage:
1. Check for NULL handling tests
2. Check for boundary value tests on numeric columns
3. If raw SQL: check for injection test cases
4. Check for empty result and single result handling

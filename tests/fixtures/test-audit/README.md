# Test Audit Fixtures

Test fixtures for validating P0.6-8 Test Audit skills.

## Directory Structure

```
tests/fixtures/
├── test-audit/              # Test files (passed to sub-agents)
│   ├── clean/
│   ├── t1-violation/
│   ├── t2-violation/
│   ├── t3-violation/
│   ├── t3plus-violation/
│   ├── mixed-types/
│   └── README.md
│
└── test-audit-expected/     # Expected results (NOT passed to sub-agents)
    ├── clean.yaml
    ├── t1-violation.yaml
    ├── t2-violation.yaml
    ├── t3-violation.yaml
    ├── t3plus-violation.yaml
    └── mixed-types.yaml
```

**Important**: Expected results are stored in a separate directory to prevent confirmation bias. Sub-agents analyzing test files should NOT have access to expected outcomes.

## Fixtures Overview

| Fixture | File | Purpose |
|---------|------|---------|
| Clean | `clean/calculator.test.ts` | No violations - baseline |
| T1 Violation | `t1-violation/proxy.test.ts` | Mocks system under test (spawn) |
| T2 Violation | `t2-violation/db.test.ts` | Call-only assertions (toHaveBeenCalled) |
| T3 Violation | `t3-violation/api.integration.ts` | Mocks HTTP in integration test |
| T3+ Violation | `t3plus-violation/workflow.integration.ts` | Broken integration chain (mock data) |
| Mixed Types | `mixed-types/everything.test.ts` | Unit + integration + e2e in one file |

## Usage

### Running Test Audit

```bash
/test-audit tests/fixtures/test-audit/
```

### Validating Results

After running, compare actual output against expected:

```bash
# Check actual output
cat logs/test-audit-*.yaml

# Compare against expected
cat tests/fixtures/test-audit-expected/t1-violation.yaml
```

## Validation Protocol

1. Run `/test-audit` on fixture
2. Review classification output (P0.6)
3. Review detection output (P0.7)
4. Review synthesis output (P0.8)
5. Compare against expected results in `test-audit-expected/`
6. Document any discrepancies

## Design Principles

### No Hints in Test Files

Test fixture files contain **only the code pattern** being tested - no comments explaining what violations exist. This ensures:

- Sub-agents detect violations through actual analysis
- No confirmation bias from reading expected outcomes
- Realistic simulation of production test auditing

### Separate Expected Results

Expected outcomes are stored in `test-audit-expected/` which is:
- Never passed to sub-agents
- Used only for human validation after audit completes
- Contains approximate values (line numbers may vary)

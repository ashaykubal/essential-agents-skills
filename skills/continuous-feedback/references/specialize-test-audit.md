# Specialization: Test Audit

This reference guides the test-audit Analyzer on what improvement patterns to look for in collected learnings.

## Target Skill Structure

The test-audit skill (`skills/test-audit/` or `.claude/skills/test-audit/`) typically contains:

| Component | Purpose |
|-----------|---------|
| `SKILL.md` | Main skill document with pipeline stages and instructions |
| `references/mock-detection-patterns.md` | Mock detection heuristics and violation examples |
| `references/deep-mode-detection.md` | Deep mode analysis prompt for LLM-based classification |
| `references/test-classification.md` | Test type classification rules (unit/integration/e2e) |
| `references/assertion-patterns.md` | Real behavior verification patterns |
| AST scripts (`scripts/`) | TypeScript AST analysis for mock detection |

## What to Look For

### Mock Detection Gaps

Learnings that reveal mock patterns the current detection misses:

- New violation patterns not covered in `mock-detection-patterns.md`
- Property-access chains (e.g., `mockOrder.id` used in new objects)
- Framework-specific mock patterns (e.g., new testing libraries)
- Edge cases where AST scripts produce false positives or false negatives
- Scale vs Deep mode disagreements that reveal detection blind spots

**Action**: Propose additions to `references/mock-detection-patterns.md` with specific violation examples.

### Assertion Pattern Additions

Learnings about how real behavior should be verified:

- New component types that need verification approaches
- Patterns where `toHaveBeenCalled` should be replaced with output checks
- File system, network, or process verification patterns discovered during debugging

**Action**: Propose additions to assertion patterns references with concrete before/after examples.

### AST Script Coverage

Learnings about AST analysis accuracy:

- Cases where AST scripts miss violations that LLM deep mode catches
- Cases where AST scripts flag false positives
- New TypeScript/JavaScript patterns that need AST support
- Performance observations (files where AST analysis is slow or times out)

**Action**: Propose specific AST pattern additions or corrections. Include the code pattern that should be detected.

### Classification Improvements

Learnings about test type classification:

- Tests misclassified as unit when they're integration (or vice versa)
- New heuristics for distinguishing test types
- Section-boundary detection improvements (where one file has multiple test types)

**Action**: Propose classification rule updates with examples of correct vs incorrect classification.

### Instruction Hardening

Learnings about LLM compliance with test-audit instructions:

- Cases where the LLM re-classified AST findings (DEF-P4-005 pattern)
- Missing BINDING language that allowed instruction drift
- Pre-Flight Gate gaps or missing threshold checks

**Action**: Propose instruction strengthening with specific MUST/MUST NOT language.

## Analysis Output Structure

For each improvement identified, produce:

1. **What was learned** — the specific learning item(s) driving this
2. **What it affects** — which test-audit component (reference file, AST script, SKILL.md section)
3. **Proposed improvement** — specific enough for the Proposer to create a copy-paste-ready change
4. **Priority** — High (current misses cause real failures), Medium (improves coverage), Low (nice to have)
5. **Evidence** — reference the source learning item IDs (L-NNN)

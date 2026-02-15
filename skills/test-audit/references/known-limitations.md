# Known Limitations

This skill has the following known limitations that are documented for transparency.

## T3+ Detection: Single-File Scope

**Issue:** AST-based data flow analysis (`ast-analyze`) traces data flow within a single file. Cross-file integration chains (e.g., mock data imported from a shared fixtures file) are not traced.

**Impact:** Estimated ~90% of T3+ violations are single-file (variable constructed in same test body). Cross-file violations (~10%) require LLM heuristics from the detection stage.

**Mitigation:** AST provides high-confidence leads for single-file cases. Detection agent (Sonnet) uses call graph analysis for cross-file patterns. Future enhancement: cross-file data flow analysis (deferred to P6+).

**Resolved (P5.10):** Previously, T3+ detection relied entirely on LLM pattern matching for variable names containing "mock". AST data-flow-analyzer now detects violations with generic variable names (e.g., `testOrder`).

## Manual Stub Pattern Detection

**Issue:** Projects using manual stub classes (e.g., `StubSharedContext`) instead of `jest.mock()` are not detected by mock indicator scanning alone.

**Impact:** Classification may not flag all files needing analysis in projects with custom stubbing patterns.

**Mitigation:** Integration/e2e files are always flagged regardless of indicators. Extended pattern detection reference docs (`references/stub-patterns.md` in mock-detection skill) provide Meszaros taxonomy patterns to the detection agent. Deep mode (≤5 files) bypasses classification entirely, analyzing all files.

**Improved (P5.12):** Detection agent now has access to extended stub/fake patterns and false positive prevention reference docs.

## Context Limits at Scale

**Issue:** Single sub-agent calls can handle ~20-25 test files before approaching context limits.

**Mitigation:** Batching with parallel sub-agents implemented for >20 files (classification) and >10 files (detection). Deep mode safety cap prevents analyzing >25 files without classification filtering.

## Resolved Limitations

The following limitations from earlier versions have been fully addressed:

| Limitation | Resolution | Version |
|-----------|-----------|---------|
| Verification line counting approximation | AST-based `verification-counter.ts` provides exact counts | P5.10 |
| Negative effectiveness percentages | Impossible with AST-precise line counts | P5.10 |
| T4 detection not automated | AST-based `skip-detector.ts` finds all skip/only/todo markers | P5.10 |
| No dual-mode for small audits | Deep mode (≤5 files) skips classification | P5.11 |
| T3+ relies on "mock" in variable names | AST `data-flow-analyzer.ts` traces data sources structurally | P5.10 |

# Synthesis Prompt Template

Use this template for Stage 3 (Synthesis). Unified for both Deep and Scale modes.

## GOAL

Synthesize classification and violation findings into prioritized audit report with test effectiveness metrics and REWRITE_REQUIRED directive.

## CONSTRAINTS

- Do NOT modify any files
- Use AST verification_lines as ground truth (not heuristic estimates)
- Calculate test effectiveness per file: `(verification_lines - affected_lines) / verification_lines`
- When multiple violations affect the same file, compute affected_lines as the UNION of all
  violation_scope ranges (merge overlapping/identical ranges), NOT the sum of individual
  affected_lines values. Example: two violations both scoped to [228, 269] = 42 affected
  lines total, not 84.
- Include T4 violations from AST skip-detect markers (these are deterministic — no LLM re-evaluation needed)
- Apply two-gate REWRITE_REQUIRED logic exactly as specified
- Priority by impact: P0 (false confidence), P1 (incomplete), P2 (pattern)
- Provide directional rewrite guidance (orchestrator figures out specifics)
- Complete within 20 tool calls

## CONTEXT

**Mode:** {deep or scale}

**Classification output:** `{classification_yaml_path}` (Scale mode only; Deep mode: "N/A — detection self-classified")

**Detection output:** `{detection_yaml_path}`

**AST skip-detect output:** `{skip_detect_json or "no markers found"}`
Include T4 violations from skip markers in the audit report. Each skip/only/todo marker is a T4 violation:
- `.skip` / `xdescribe` / `xit` → severity: medium, "Test disabled"
- `.only` / `fdescribe` / `fit` → severity: high, "Focus marker — other tests not running in CI"
- `.todo` → severity: low, "Test placeholder — not implemented"

**AST verify-count output:** `{verify_count_json}`
Use `metrics.test_logic_lines` as the authoritative `verification_lines` for effectiveness calculation.

**Two-gate REWRITE_REQUIRED logic:**
- Gate 1: Any P0 violation → REWRITE_REQUIRED regardless of percentage
- Gate 2: P1 violations + any file <95% effectiveness → REWRITE_REQUIRED
- Advisory: P1 >=95% or P2 only → recommendations only

**Priority classification:**
- P0: False confidence (T1, T3+) - test passes but provides no assurance
- P1: Incomplete verification (T2, T3) - runs real code but doesn't fully verify
- P2: Pattern issues (T4 skip/only/todo) - style, organization, disabled tests

## OUTPUT

Write audit report to: `logs/test-audit-{YYYYMMDD-HHMMSS}.yaml`

Write diagnostics to: `logs/diagnostics/test-audit-{YYYYMMDD-HHMMSS}.yaml`

Use the schema in `references/schemas/audit-output.yaml`.

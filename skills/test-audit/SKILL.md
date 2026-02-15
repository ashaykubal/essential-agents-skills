---
name: test-audit
description: Audit test suites for T1-T4 violations using AST analysis, mock detection, and multi-stage synthesis. Invoke when user asks to audit tests, check test quality, find mock violations, review test effectiveness, or inspect test suites for over-mocking. Triggers automatic rewrites when quality gates fail.
user-invocable: true
argument-hint: [path] [--threshold=N]
skills:
  - test-classification
  - mock-detection
  - assertion-patterns
  - component-patterns
  - bug-magnet-data
---

# Test Audit

User-facing entry point for test suite quality auditing. Orchestrates classification, mock detection, and synthesis stages to identify T1-T4 violations and trigger automatic rewrites when required.

---

## When to Use This Skill

**Load this skill when the user request matches ANY of these patterns:**

| Trigger Pattern | Example User Request |
|-----------------|---------------------|
| Test quality audit | "Audit my tests", "Check test quality", "Review test suite" |
| Mock detection | "Find mock violations", "Check for T1 violations", "Are my tests over-mocked?" |
| Test effectiveness | "How effective are my tests?", "Are my tests real or mocked?" |
| After writing tests | "I just wrote tests for X, can you audit them?" |
| CI/CD integration | "Add test audit to pipeline", "Validate tests before merge" |

**DO NOT use for:**
- Running tests (use `npx jest` (or your project test runner))
- Writing new tests (implement directly)
- General code review (use `code-review` skill)
- Debugging test failures (use `issue-debugging` skill)

---

## Pre-Flight Gate (BLOCKING)

**STOP. Before ANY analysis, you MUST acknowledge what this skill requires.**

This skill uses a **multi-stage pipeline with sub-agents**. You are the orchestrator, NOT the executor.

### What You MUST Do

1. **Run Stage 0 AST scripts** before any LLM stages:
   - `npx tsx skills/test-audit/scripts/verification-counter.ts {target}` → `/tmp/claude/ast-verify-count.json`
   - `npx tsx skills/test-audit/scripts/skip-detector.ts {target}` → `/tmp/claude/ast-skip-detect.json`
   - `npx tsx skills/test-audit/scripts/data-flow-analyzer.ts {target}` → `/tmp/claude/ast-data-flow.json`

2. **Select mode** based on file count and threshold (default 5)

3. **Spawn sub-agents** for each applicable stage:
   - Stage 1 (Scale mode only): Classification → `Task(subagent_type="general-purpose", model="haiku", ...)`
   - Stage 2: Mock Detection → `Task(subagent_type="general-purpose", model="sonnet", ...)`
   - Stage 3: Synthesis → `Task(subagent_type="general-purpose", model="sonnet", ...)`

4. **Write outputs to logs/**:
   - `logs/test-classification-{YYYYMMDD-HHMMSS}.yaml` (Scale mode only)
   - `logs/mock-detection-{YYYYMMDD-HHMMSS}.yaml`
   - `logs/test-audit-{YYYYMMDD-HHMMSS}.yaml`
   - `logs/diagnostics/test-audit-{YYYYMMDD-HHMMSS}.yaml`

5. **Follow the orchestration instructions exactly** - do not substitute your own judgment

### What You MUST NOT Do

- **Do NOT skip Stage 0** - AST scripts provide deterministic metadata that LLM stages depend on
- **Do NOT perform classification yourself** - spawn a Haiku sub-agent (Scale mode)
- **Do NOT perform mock detection yourself** - spawn a Sonnet sub-agent
- **Do NOT perform synthesis yourself** - spawn a Sonnet sub-agent
- **Do NOT skip stages** because you think you can do it faster
- **Do NOT return to user** until all log files are written

### Why This Matters

The pipeline exists for:
- **Bias avoidance** - Different models for different stages prevent self-review bias
- **Structured artifacts** - Logs enable observability and debugging
- **Deterministic workflow** - Reproducible results across sessions
- **Separation of concerns** - Each stage has a specific role

**If you find yourself thinking "I can just analyze this directly" - STOP. That violates SC1-SC2 in Rules.md.**

### Completion Checklist

Before returning to user, verify ALL items:

- [ ] Stage 0 (AST) completed - outputs in `/tmp/claude/ast-*.json` (or graceful degradation logged)
- [ ] Mode selected (Deep or Scale) and displayed to user
- [ ] Stage 1 (Classification) completed (Scale mode only) - output written to `logs/test-classification-*.yaml`
- [ ] Stage 2 (Mock Detection) completed - output written to `logs/mock-detection-*.yaml`
- [ ] Stage 3 (Synthesis) completed - output written to `logs/test-audit-*.yaml`
- [ ] Summary presented to user with violation counts and REWRITE_REQUIRED status
- [ ] Diagnostic output written to `logs/diagnostics/test-audit-*.yaml` (includes mode, threshold, AST status)

**If REWRITE_REQUIRED == true, also verify:**
- [ ] For each file: component type identified
- [ ] For each file: `bug-magnet-data` context file loaded for component type
- [ ] For each file: T0 + T1 edge cases loaded from bug-magnet-data
- [ ] Verification scripts include edge cases from bug-magnet-data
- [ ] Destructive patterns (`safe_for_automation: false`) excluded or marked manual-only
- [ ] Rewrites applied using assertion-patterns and component-patterns

**Do NOT return to user until all applicable checklist items are verified.**

---

## Usage

```
/test-audit [path] [--threshold=N]
```

**Examples:**
- `/test-audit tests/` - Audit all tests in tests/ directory
- `/test-audit src/__tests__/api.test.ts` - Audit specific file
- `/test-audit tests/ --threshold=10` - Force Scale mode for ≤10 files
- `/test-audit` - Audit tests mentioned in recent context (or prompt for path)

---

## Pipeline Overview

```
/test-audit tests/
        ↓
┌─────────────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR (Opus) - Main Context                      │
│                                                                     │
│  Stage 0: AST Pre-Processing (deterministic, no LLM)                │
│     └─ npx tsx skills/test-audit/scripts/verification-counter.ts {target}                                   │
│     └─ npx tsx skills/test-audit/scripts/skip-detector.ts {target}                                    │
│     └─ npx tsx skills/test-audit/scripts/data-flow-analyzer.ts {target}                                    │
│     └─ Output: /tmp/claude/ast-*.json                               │
│                                                                     │
│  Mode Selection: file_count ≤ threshold → Deep, else → Scale        │
│                                                                     │
│  ┌─── DEEP MODE (≤5 files) ──────── SCALE MODE (>5 files) ────┐    │
│  │                                                              │    │
│  │  [skip classification]          Stage 1: Classification      │    │
│  │                                    └─ Haiku + AST hints      │    │
│  │                                                              │    │
│  │  Stage 2: Detection             Stage 2: Detection           │    │
│  │    └─ Sonnet, ALL files           └─ Sonnet, flagged only    │    │
│  │    └─ Self-computes metadata      └─ Uses classification     │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  Stage 3: Synthesis (Sonnet) — unified for both modes               │
│                                                                     │
│  Step 4: Present summary to user                                    │
│                                                                     │
│  Step 5: If REWRITE_REQUIRED → Implement rewrites (Opus)            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Orchestration Instructions

When this skill is loaded, follow these steps exactly:

### Step 1: Resolve Target

```
IF $ARGUMENTS provided:
    target = $1 (first argument)
    Parse optional flags:
        --threshold=N  → override default threshold (default: 5)
ELSE:
    Look for test files in recent conversation context
    IF found: target = that path
    ELSE: Ask user: "Which test directory or file should I audit?"
```

### Step 2: Stage 0 — AST Pre-Processing (MANDATORY)

**This step is BINDING. Do NOT skip it.** AST scripts provide deterministic metadata that replaces heuristic estimates. Skipping Stage 0 degrades audit accuracy.

1. Generate timestamp: `YYYYMMDD-HHMMSS`
2. Count test files in target (glob `**/*.test.{ts,tsx,js,jsx}` + `**/*.spec.{ts,tsx,js,jsx}`)
3. Run all four AST scripts directly via npx tsx:

```bash
npx tsx skills/test-audit/scripts/verification-counter.ts {target} > /tmp/claude/ast-verify-count.json
npx tsx skills/test-audit/scripts/skip-detector.ts {target} > /tmp/claude/ast-skip-detect.json
npx tsx skills/test-audit/scripts/data-flow-analyzer.ts {target} > /tmp/claude/ast-data-flow.json
npx tsx skills/test-audit/scripts/integration-mock-detector.ts {target} > /tmp/claude/ast-integration-mocks.json
```

4. Read each output file and verify valid JSON
5. If any script fails: log warning in diagnostics, continue with LLM-only analysis for that dimension (graceful degradation)

**AST output schemas** (for prompt injection into LLM stages):

```json
// verify-count output (per file)
{ "file": "tests/user.test.ts", "metrics": { "total_lines": 156, "test_logic_lines": 98, "assertion_lines": 42, "setup_lines": 56, "effectiveness_percent": 42.86, "framework_detected": "jest" } }

// skip-detect output (per file)
{ "file": "tests/user.test.ts", "markers": [{ "type": "test.skip", "line": 42, "test_name": "should handle edge case", "severity": "medium", "rule": "T4" }], "summary": { "skip_count": 1, "only_count": 0, "todo_count": 0 } }

// ast-analyze output (per file)
{ "file": "tests/workflow.integration.ts", "violations": [{ "line": 42, "type": "T3+", "confidence": "high", "variable": "orderData", "source": "object_literal", "message": "Variable 'orderData' is manually constructed", "suggestion": "Replace with factory function or upstream function output" }] }

// integration-mocks output (per file)
{ "file": "tests/error-handler.test.ts", "sections": [{ "name": "Error Handler Integration", "type": "integration", "signal": "keyword_in_name", "line_start": 559, "line_end": 628 }], "leads": [{ "line": 562, "type": "T3", "confidence": "high", "mock_pattern": "jest.fn().mockImplementation()", "enclosing_block": "Error Handler Integration", "block_type": "integration", "message": "Mock call in integration test block", "suggestion": "Replace mock with actual implementation" }], "summary": { "sections_found": 1, "integration_sections": 1, "e2e_sections": 0, "leads_count": 1, "mock_calls_in_integration": 1, "mock_calls_in_e2e": 0 } }
```

### Step 3: Mode Selection

```
threshold = $THRESHOLD_FLAG OR 5 (default)
file_count = count of test files in target

IF file_count <= threshold:
    IF file_count > 25:
        mode = "scale"
        WARN "Deep mode safety cap exceeded (>25 files). Falling back to Scale mode."
    ELSE:
        mode = "deep"
ELSE:
    mode = "scale"
```

**Display mode selection to user:**

```
## Test Audit: {mode} Mode

**Target:** {target}
**Files:** {file_count}
**Threshold:** {threshold}
**Mode:** {mode} ({rationale})

Stage 0 (AST): {status — success/partial/failed}
  verify-count: {ok/failed}
  skip-detect: {ok/failed}
  ast-analyze: {ok/failed}

Proceeding with {mode} mode pipeline...
```

### Step 4: Classification Stage — Scale Mode Only

**Skip this step entirely in Deep mode.** In Deep mode, detection (Step 5) self-computes classification metadata using AST output.

1. Access the `test-classification` skill (loaded via frontmatter dependency)

**Batching check:**
```
IF file_count > 20:
    Split files into batches of 20-25
    FOR each batch IN PARALLEL:
        Construct 4-part prompt with batch file list
        INCLUDE AST hints in CONTEXT (verify-count + skip-detect per file)
        Task(subagent_type="general-purpose", model="haiku",
             prompt=batch_prompt, run_in_background=true)
    Read all batch outputs
    Merge into single classification YAML
ELSE:
    Construct 4-part prompt using the skill's template
    INCLUDE AST hints in CONTEXT (verify-count + skip-detect per file)
    Task(subagent_type="general-purpose", model="haiku", prompt=...)
```

**AST hints for classification CONTEXT:**
```
The following AST-computed metadata is available for each file.
Use this to improve classification accuracy — these are deterministic,
not heuristic.

{for each file in target}:
  file: {path}
  ast_verification_lines: {metrics.test_logic_lines}
  ast_assertion_lines: {metrics.assertion_lines}
  ast_skip_markers: {markers array or "none"}
  ast_data_flow_violations: {violations array or "none"}
```

2. Read output from `logs/test-classification-{YYYYMMDD-HHMMSS}.yaml`
3. Verify output contains `files` array with classification data

### Step 5: Detection Stage (Sonnet)

**Behavior differs by mode:**

#### Deep Mode Detection

In Deep mode, ALL files are analyzed (no classification filtering). The detection agent self-computes classification metadata from AST output.

1. Access the `mock-detection` skill (loaded via frontmatter dependency)
2. Construct the Deep Mode Detection Prompt (see "Deep Mode Detection Prompt" section below)
3. Include ALL test files in the prompt with their AST metadata

**Batching check (deep mode):**
```
IF file_count > 10:
    Split files into batches of 10-15
    FOR each batch:
        Include full AST metadata per file
        Task(subagent_type="general-purpose", model="sonnet",
             prompt=deep_mode_batch_prompt, run_in_background=true)
    Read all batch outputs
    Merge into single detection YAML
ELSE:
    Task(subagent_type="general-purpose", model="sonnet",
         prompt=deep_mode_prompt)
```

#### Scale Mode Detection

In Scale mode, only files flagged by classification are analyzed.

1. Access the `mock-detection` skill (loaded via frontmatter dependency)
2. Extract files with `needs_deep_analysis: true` from classification output
3. Count flagged files

**Batching check (scale mode):**
```
IF flagged_file_count > 10:
    Split flagged files into batches of 10-15
    FOR each batch:
        Include verification_lines from classification for each file
        Include AST metadata (data-flow violations, skip markers) per file
        Task(subagent_type="general-purpose", model="sonnet",
             prompt=batch_prompt, run_in_background=true)
    Read all batch outputs
    Merge into single detection YAML
ELSE:
    Construct 4-part prompt using the skill's template
    Include AST metadata in CONTEXT
    Task(subagent_type="general-purpose", model="sonnet", prompt=...)
```

4. Read output from `logs/mock-detection-{YYYYMMDD-HHMMSS}.yaml`
5. Verify output contains `violations` array and `file_summaries`

### Step 6: Synthesis Stage (Sonnet)

1. Construct synthesis prompt using template below (unified for both modes)
2. Include detection output in CONTEXT
3. Include classification output in CONTEXT (Scale mode) or note "Deep mode — no classification stage" (Deep mode)
4. Include AST skip-detect output for T4 violation synthesis
5. Spawn sub-agent:
   ```
   Task(
     subagent_type="general-purpose",
     model="sonnet",
     prompt="[synthesis 4-part prompt]"
   )
   ```
6. Read output from `logs/test-audit-{YYYYMMDD-HHMMSS}.yaml`
7. Verify output contains `directive.REWRITE_REQUIRED` field

### Step 7: Present Summary

Display audit summary to user before any rewrites:

```
## Test Audit Complete ({mode} Mode)

**Target:** {target}
**Files audited:** {total_files}
**Files analyzed:** {files_analyzed} (deep: all, scale: flagged only)
**Overall test effectiveness:** {percentage}%

### Stage 0 (AST)
- Verification lines: AST-precise (not heuristic)
- Skip markers (T4): {count} found
- Data flow leads (T3+): {count} found

### Violations by Priority
- P0 (False confidence): {count}
- P1 (Incomplete verification): {count}
- P2 (Pattern issues): {count}

### REWRITE_REQUIRED: {true/false}
Gate triggered: {gate description}

[If true] Proceeding with automatic rewrites...
[If false] No automatic rewrites needed. See recommendations below.
```

### Step 8: Evaluate REWRITE_REQUIRED (Two-Gate)

Apply two-gate logic from audit report:

**Gate 1 (Impact):**
```
IF any P0 violations exist:
    REWRITE_REQUIRED = true
    gate_triggered = "Gate 1: Impact (P0 violations - false confidence)"
```

**Gate 2 (Threshold):**
```
ELSE IF P1 violations exist:
    IF any file has test_effectiveness < 95%:
        REWRITE_REQUIRED = true
        gate_triggered = "Gate 2: Threshold (P1 + effectiveness < 95%)"
    ELSE:
        REWRITE_REQUIRED = false
        status = "Advisory only (P1 above 95% threshold)"
```

**Advisory:**
```
ELSE (P2 only):
    REWRITE_REQUIRED = false
    status = "Advisory only (P2 pattern issues)"
```

### Step 9: Rewrite (If Required)

```
IF REWRITE_REQUIRED == true:
    Read `references/rewrite-instructions.md` and follow the procedure
    for each file in directive.files_to_rewrite (ordered by priority, then effectiveness).
    Uses: assertion-patterns, component-patterns, bug-magnet-data skills.
ELSE:
    Display recommendations without auto-rewrite
```

---

## Deep Mode Detection Prompt

Read `references/prompts/deep-mode-detection.md` and use as the Task() prompt for the Sonnet detection sub-agent in Deep mode. Inject per-file AST metadata into the prompt's CONTEXT placeholders (verification_lines, skip_markers, data_flow_leads, integration_mock_leads from Stage 0 output).

---

## Synthesis Prompt Template

Read `references/prompts/synthesis.md` and use as the Task() prompt for the Sonnet synthesis sub-agent. Inject the following into the prompt's CONTEXT placeholders:
- `{deep or scale}` → current mode
- `{classification_yaml_path}` → classification log path (Scale) or "N/A" (Deep)
- `{detection_yaml_path}` → detection log path
- `{skip_detect_json}` → AST skip-detect output
- `{verify_count_json}` → AST verify-count output

---

## Priority Classification

Full definitions: `references/priority-classification.md`

- **P0 (False confidence):** T1 (mock SUT), T3+ (broken chain) — test passes but provides no assurance
- **P1 (Incomplete verification):** T2 (call-only), T3 (mocked boundary) — real code runs but not fully verified
- **P2 (Pattern issues):** T4 (skip/only/todo), minor patterns — style and disabled tests

---

## Output Schema

Full schema with example: `references/schemas/audit-output.yaml`

Key fields the orchestrator validates after synthesis:
- `directive.REWRITE_REQUIRED` — boolean, drives Step 9
- `directive.gate_triggered` — which gate fired
- `directive.files_to_rewrite` — ordered list for rewrite step
- `audit.file_analysis[].test_effectiveness` — per-file percentage
- `audit.overview.overall_effectiveness` — aggregate metric

---

## Diagnostic Output

Write diagnostic output to `logs/diagnostics/test-audit-{YYYYMMDD-HHMMSS}.yaml`.

Schema: `references/schemas/diagnostic-output.yaml`. Includes mode selection, Stage 0 AST status, gate evaluation, and per-file decisions with `verification_lines_source: ast | heuristic`.

---

## Integration Notes

### Hook Integration

This skill can be triggered by:
1. **Direct invocation:** `/test-audit [path]`
2. **Pipeline hook:** PostToolUse on `*.test.*` files suggests Test Audit pipeline

Both paths use the same orchestration flow.

### AST Scripts

All AST scripts live in `skills/test-audit/scripts/` and are invoked directly via npx tsx:

| Recipe | Script | Purpose |
|--------|--------|---------|
| `npx tsx skills/test-audit/scripts/verification-counter.ts` | `verification-counter.ts` | Precise line counting (replaces heuristic) |
| `npx tsx skills/test-audit/scripts/skip-detector.ts` | `skip-detector.ts` | T4 skip/only/todo marker detection |
| `npx tsx skills/test-audit/scripts/data-flow-analyzer.ts` | `data-flow-analyzer.ts` | T3+ broken chain detection via data flow tracing |

Scripts use ts-morph for AST parsing, run via `npx tsx`, and output JSON to stdout. Dependencies are in `skills/test-audit/scripts/package.json`.

---

## Known Limitations

See `references/known-limitations.md` for full details including resolved limitations history.

**Active limitations:** T3+ single-file scope (~90% coverage), manual stub detection gaps (mitigated by Deep mode + extended patterns), context limits at scale (mitigated by batching).

---

## Supporting Files

| File | Purpose |
|------|---------|
| `references/prompts/deep-mode-detection.md` | 4-part prompt for Deep mode detection sub-agent |
| `references/prompts/synthesis.md` | 4-part prompt for synthesis sub-agent |
| `references/schemas/audit-output.yaml` | Output schema with example for audit report |
| `references/schemas/diagnostic-output.yaml` | Diagnostic output schema |
| `references/priority-classification.md` | P0/P1/P2 definitions with T-rule impact tables |
| `references/known-limitations.md` | Active and resolved limitations |
| `references/rewrite-instructions.md` | Step 9 rewrite procedure with bug-magnet-data integration |

---

## Related Skills

- `test-classification` (P0.6) - Classification prompt template
- `mock-detection` (P0.7) - Detection prompt template + `references/stub-patterns.md`, `references/false-positive-prevention.md`
- `pipeline-templates` (P0.3) - Test Audit pipeline definition
- `subagent-prompting` (P0.1) - 4-part template reference
- `bug-magnet-data` (P4.2) - Curated edge case test data

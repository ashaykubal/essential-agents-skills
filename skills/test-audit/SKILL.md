---
name: test-audit
description: Audit test suite quality and identify T1-T4 violations. Orchestrates classification and mock detection stages using dependency skills.
user-invocable: true
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
- Running tests (use `just test`)
- Writing new tests (implement directly)
- General code review (use `code-review` skill)
- Debugging test failures (use `issue-debugging` skill)

---

## Pre-Flight Gate (BLOCKING)

**STOP. Before ANY analysis, you MUST acknowledge what this skill requires.**

This skill uses a **multi-stage pipeline with sub-agents**. You are the orchestrator, NOT the executor.

### What You MUST Do

1. **Spawn sub-agents** for each stage:
   - Stage 1: Classification → `Task(subagent_type="general-purpose", model="haiku", ...)`
   - Stage 2: Mock Detection → `Task(subagent_type="general-purpose", model="sonnet", ...)`
   - Stage 3: Synthesis → `Task(subagent_type="general-purpose", model="sonnet", ...)`

2. **Write outputs to logs/**:
   - `logs/test-classification-{timestamp}.yaml`
   - `logs/mock-detection-{timestamp}.yaml`
   - `logs/test-audit-{timestamp}.yaml`
   - `logs/diagnostics/test-audit-{timestamp}.yaml`

3. **Follow the orchestration instructions exactly** - do not substitute your own judgment

### What You MUST NOT Do

- **Do NOT perform classification yourself** - spawn a Haiku sub-agent
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

- [ ] Stage 1 (Classification) completed - output written to `logs/test-classification-*.yaml`
- [ ] Stage 2 (Mock Detection) completed - output written to `logs/mock-detection-*.yaml`
- [ ] Stage 3 (Synthesis) completed - output written to `logs/test-audit-*.yaml`
- [ ] Summary presented to user with violation counts and REWRITE_REQUIRED status
- [ ] Diagnostic output written to `logs/diagnostics/test-audit-*.yaml`

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
/test-audit [path]
```

**Examples:**
- `/test-audit tests/` - Audit all tests in tests/ directory
- `/test-audit src/__tests__/api.test.ts` - Audit specific file
- `/test-audit` - Audit tests mentioned in recent context (or prompt for path)

---

## Pipeline Overview

```
/test-audit tests/
        ↓
┌─────────────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR (Opus) - Main Context                      │
│                                                                     │
│  Stage 1: Classification (Haiku)                                    │
│     └─ Load test-classification skill, spawn sub-agent              │
│     └─ Output: logs/test-classification-{ts}.yaml                   │
│                                                                     │
│  Stage 2: Mock Detection (Sonnet)                                   │
│     └─ Load mock-detection skill, spawn sub-agent                   │
│     └─ Output: logs/mock-detection-{ts}.yaml                        │
│                                                                     │
│  Stage 3: Synthesis (Sonnet)                                        │
│     └─ Construct synthesis prompt, spawn sub-agent                  │
│     └─ Output: logs/test-audit-{ts}.yaml                            │
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
ELSE:
    Look for test files in recent conversation context
    IF found: target = that path
    ELSE: Ask user: "Which test directory or file should I audit?"
```

### Step 2: Classification Stage (Haiku)

1. Access the `test-classification` skill (loaded via frontmatter dependency)
2. Generate timestamp: `YYYYMMDD-HHMMSS`
3. Count files in target directory

**Batching check:**
```
IF file_count > 20:
    Split files into batches of 20-25
    FOR each batch IN PARALLEL:
        Construct 4-part prompt with batch file list
        Task(subagent_type="general-purpose", model="haiku",
             prompt=batch_prompt, run_in_background=true)
    Read all batch outputs
    Merge into single classification YAML
ELSE:
    Construct 4-part prompt using the skill's template
    Task(subagent_type="general-purpose", model="haiku", prompt=...)
```

4. Read output from `logs/test-classification-{YYYYMMDD-HHMMSS}.yaml`
5. Verify output contains `files` array with classification data

### Step 3: Detection Stage (Sonnet)

1. Access the `mock-detection` skill (loaded via frontmatter dependency)
2. Extract files with `needs_deep_analysis: true` from classification output
3. Count flagged files

**Batching check:**
```
IF flagged_file_count > 10:
    Split flagged files into batches of 10-15
    FOR each batch IN PARALLEL:
        Construct 4-part prompt with batch file list
        Include verification_lines from classification for each file
        Task(subagent_type="general-purpose", model="sonnet",
             prompt=batch_prompt, run_in_background=true)
    Read all batch outputs
    Merge into single detection YAML
ELSE:
    Construct 4-part prompt using the skill's template
    Task(subagent_type="general-purpose", model="sonnet", prompt=...)
```

4. Read output from `logs/mock-detection-{YYYYMMDD-HHMMSS}.yaml`
5. Verify output contains `violations` array and `file_summaries`

### Step 4: Synthesis Stage (Sonnet)

1. Construct synthesis prompt using template below
2. Include classification and detection outputs in CONTEXT
3. Spawn sub-agent:
   ```
   Task(
     subagent_type="general-purpose",
     model="sonnet",
     prompt="[synthesis 4-part prompt]"
   )
   ```
4. Read output from `logs/test-audit-{YYYYMMDD-HHMMSS}.yaml`
5. Verify output contains `directive.REWRITE_REQUIRED` field

### Step 5: Present Summary

Display audit summary to user before any rewrites:

```
## Test Audit Complete

**Files audited:** {total_files}
**Files with violations:** {files_with_violations}
**Overall test effectiveness:** {percentage}%

### Violations by Priority
- P0 (False confidence): {count}
- P1 (Incomplete verification): {count}
- P2 (Pattern issues): {count}

### REWRITE_REQUIRED: {true/false}
Gate triggered: {gate description}

[If true] Proceeding with automatic rewrites...
[If false] No automatic rewrites needed. See recommendations below.
```

### Step 6: Evaluate REWRITE_REQUIRED (Two-Gate)

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

### Step 7: Rewrite (If Required)

```
IF REWRITE_REQUIRED == true:
    FOR each file in files_to_rewrite (ordered by priority, then effectiveness):
        1. Read the file
        2. Load `assertion-patterns` skill for T1-T4 transformation patterns
        3. Identify component type from code analysis
        4. Load `component-patterns` skill for verification templates
        5. Load `bug-magnet-data` context file matching component type:
           - CLI: context/cli-args.md
           - HTTP Server: context/http-body.md
           - File Parser: context/file-contents.md
           - Database: context/db-query.md
           - Process Spawner: context/process-spawn.md
        6. Load T0 + T1 edge cases from bug-magnet-data/data/ for the component:
           - T0 (Always): strings/boundaries, numbers/boundaries, booleans/boundaries
           - T1 (Common): strings/injection (if input handling), strings/unicode
        7. Select applicable patterns for the violation type:
           - T1 fix: Apply "Function call" or "Process spawn" patterns from assertion-patterns
           - T2 fix: Apply "Add result assertion" pattern from assertion-patterns
           - T3 fix: Apply "HTTP Server" or appropriate boundary pattern from component-patterns
           - T3+ fix: Apply chain patterns from assertion-patterns
        8. Generate verification script as intermediate artifact:
           - Location: tmp/verification/{test-name}-verify.{ext}
           - Purpose: Validate rewrite works before modifying test
           - REQUIRED: Include edge cases from bug-magnet-data in verification
        9. Rewrite test file using structured patterns
       10. Run verification script to confirm fix
       11. Run original test to verify it now passes
ELSE:
    Display recommendations without auto-rewrite
```

**Bug-Magnet-Data Integration (REQUIRED)**

When generating verification scripts (step 8), you MUST include edge cases from bug-magnet-data:

1. **Read the context file** for the detected component type (step 5)
2. **Load applicable data files** based on context file's "Applicable Categories" section
3. **Include at minimum**:
   - Empty string / zero / null boundary values (T0)
   - Length extremes for any string inputs (T0)
   - Injection patterns if component handles external input (T1)
4. **Mark destructive patterns** (`safe_for_automation: false`) as manual-only in script comments

---

## Synthesis Prompt Template

Use this template for Stage 4 (Synthesis):

### GOAL

Synthesize classification and violation findings into prioritized audit report with test effectiveness metrics and REWRITE_REQUIRED directive.

### CONSTRAINTS

- Do NOT modify any files
- Calculate test effectiveness per file: `(verification_lines - affected_lines) / verification_lines`
- Apply two-gate REWRITE_REQUIRED logic exactly as specified
- Priority by impact: P0 (false confidence), P1 (incomplete), P2 (pattern)
- Provide directional rewrite guidance (orchestrator figures out specifics)
- Complete within 20 tool calls

### CONTEXT

**Classification output:** `{classification_yaml_path}`

**Detection output:** `{detection_yaml_path}`

**Two-gate REWRITE_REQUIRED logic:**
- Gate 1: Any P0 violation → REWRITE_REQUIRED regardless of percentage
- Gate 2: P1 violations + any file <95% effectiveness → REWRITE_REQUIRED
- Advisory: P1 >=95% or P2 only → recommendations only

**Priority classification:**
- P0: False confidence (T1, T3+) - test passes but provides no assurance
- P1: Incomplete verification (T2, T3) - runs real code but doesn't fully verify
- P2: Pattern issues - style and organization

### OUTPUT

Write audit report to: `logs/test-audit-{YYYYMMDD-HHMMSS}.yaml`

Write diagnostics to: `logs/diagnostics/test-audit-{YYYYMMDD-HHMMSS}.yaml`

Use the schema specified in "Output Schema" section.

---

## Two-Gate REWRITE_REQUIRED Logic

### Gate 1: Impact Gate

Triggers on **any P0 violation** regardless of percentage.

**Rationale:** P0 violations (T1, T3+) provide false confidence. A test that passes due to mocking the system under test is worse than no test - it provides false assurance. These must be fixed regardless of how many there are.

### Gate 2: Threshold Gate

Triggers on **P1 violations** when **any file has test effectiveness < 95%**.

**Rationale:** P1 violations (T2, T3) indicate incomplete verification. If test effectiveness is still high (>=95%), the issue is contained. If it drops below 95%, the incomplete verification is widespread enough to require action.

### Advisory Only

When neither gate triggers (P2 only, or P1 with >=95% effectiveness), provide recommendations without automatic rewrites.

---

## Priority Classification

### P0: False Confidence

Tests that pass but should not be trusted:

| Rule | Impact |
|------|--------|
| T1 | Mock hides real failures - test always passes regardless of SUT behavior |
| T3+ | Broken integration chain - no real integration is tested |

### P1: Incomplete Verification

Tests that run real code but don't fully verify:

| Rule | Impact |
|------|--------|
| T2 | Call happened but effect not verified |
| T3 | Integration boundary mocked - partial integration only |

### P2: Pattern Issues

Style and organization issues that don't directly impact test reliability.

---

## Output Schema

```yaml
metadata:
  skill: test-audit
  timestamp: "{ISO-8601}"
  sources:
    classification: logs/test-classification-{YYYYMMDD-HHMMSS}.yaml
    detection: logs/mock-detection-{YYYYMMDD-HHMMSS}.yaml
  model: sonnet

audit:
  overview:
    total_files: 25
    files_analyzed: 5
    total_verification_lines: 1250
    total_affected_lines: 154
    overall_effectiveness: 88%

  file_analysis:
    - file: tests/proxy.test.ts
      verification_lines: 95
      affected_lines: 80
      test_effectiveness: 16%
      priority: P0
      violations: [T1]
      impact: "False confidence - spawn mock hides startup failures"
      rewrite_direction: |
        Use real child_process.spawn(). Verify with port check.
        Test should actually start proxy and verify it's listening.

    - file: tests/workflow.integration.ts
      verification_lines: 50
      affected_lines: 36
      test_effectiveness: 28%
      priority: P0
      violations: [T3+]
      impact: "False confidence - broken integration chain"
      rewrite_direction: |
        Chain real function outputs. Remove mock data injection.
        Replace mockOrderData with: const order = await createOrder(input);

    - file: tests/api.integration.ts
      verification_lines: 55
      affected_lines: 37
      test_effectiveness: 33%
      priority: P1
      violations: [T3]
      impact: "Incomplete verification - mocked HTTP"
      rewrite_direction: |
        Use MSW or test server instead of jest.mock('node-fetch').
        Test should verify actual HTTP request/response cycle.

    - file: tests/config.test.ts
      verification_lines: 40
      affected_lines: 1
      test_effectiveness: 98%
      priority: P1
      violations: [T2]
      impact: "Incomplete verification - call-only assertion"
      rewrite_direction: |
        Add result assertion after toHaveBeenCalled().
        Verify the actual saved value matches expected.

  recommendations:
    - "Establish test harness for proxy testing"
    - "Create shared fixtures for integration tests"
    - "Consider test utilities for common verification patterns"

directive:
  REWRITE_REQUIRED: true
  gate_triggered: "Gate 1: Impact (P0 violations exist)"
  files_to_rewrite:
    - path: tests/proxy.test.ts
      priority: P0
      test_effectiveness: 16%
    - path: tests/workflow.integration.ts
      priority: P0
      test_effectiveness: 28%
    - path: tests/api.integration.ts
      priority: P1
      test_effectiveness: 33%
  files_advisory:
    - path: tests/config.test.ts
      priority: P1
      test_effectiveness: 98%
      reason: "Above 95% threshold - advisory only"
  threshold: 95%
  rationale: "Gate 1 triggered: 2 P0 violations (false confidence). Gate 2 would also trigger: 1 P1 file below threshold."

summary: |
  Audit complete: 5 files analyzed, 4 with violations.
  REWRITE_REQUIRED: true (Gate 1 - P0 violations)
  Priority rewrites: proxy.test.ts (P0, 16%), workflow.integration.ts (P0, 28%), api.integration.ts (P1, 33%)
  Advisory: config.test.ts (P1, 98% - above threshold)
```

---

## Diagnostic Output

Write diagnostic output to `logs/diagnostics/test-audit-{YYYYMMDD-HHMMSS}.yaml`:

```yaml
diagnostic:
  skill: test-audit
  timestamp: "{ISO-8601}"
  model: sonnet

execution:
  stages_completed: 3
  total_tool_calls: 12
  classification_source: logs/test-classification-{ts}.yaml
  detection_source: logs/mock-detection-{ts}.yaml

gate_evaluation:
  gate_1_check: true
  gate_1_result: "triggered (2 P0 violations)"
  gate_2_check: false
  gate_2_result: "not evaluated (Gate 1 triggered)"

decisions:
  - file: tests/proxy.test.ts
    decision: rewrite_required
    reason: "P0 violation (T1) - false confidence"
    effectiveness: 16%

  - file: tests/config.test.ts
    decision: advisory_only
    reason: "P1 violation but 98% effectiveness >= 95% threshold"
    effectiveness: 98%

errors: []
```

---

## Integration Notes

### Hook Integration

This skill can be triggered by:
1. **Direct invocation:** `/test-audit [path]`
2. **Pipeline hook:** PostToolUse on `*.test.*` files suggests Test Audit pipeline

Both paths use the same orchestration flow.

### Bias Avoidance

The orchestrator (Opus) does NOT perform audit/review work:
- Classification: Haiku (surface pattern matching)
- Detection: Sonnet (contextual analysis)
- Synthesis: Sonnet (prioritization and directive)
- Rewrites: Opus (mechanical code changes)

This prevents the implementer from reviewing its own potential biases.

### Automatic Rewrite

Rewrites happen automatically when `REWRITE_REQUIRED: true`. The audit summary is presented before rewrites begin (user has visibility), but no confirmation is required.

---

## Known Limitations

This skill has the following known limitations that are documented for transparency:

### T3+ Detection Fragility

**Issue:** T3+ (broken integration chain) detection relies on LLM pattern matching for variable names containing "mock" or similar indicators.

**Impact:** Subtle T3+ violations using generic variable names (e.g., `testOrder` instead of `mockOrder`) may not be detected.

**Mitigation:** Integration/e2e files are always flagged for deep analysis regardless of mock indicators. Future enhancement: AST-based data flow analysis.

### Verification Line Counting Approximation

**Issue:** Line counting is heuristic-based, not AST-parsed. Negative effectiveness percentages can occur when violation scope exceeds verification lines.

**Impact:** Test effectiveness percentages are approximate, not exact.

**Mitigation:** Two-gate logic uses P0/P1 priority as primary trigger, with 95% threshold as secondary. Future enhancement: AST-based verification counter.

### T4 Detection Not Implemented

**Issue:** T4 (skipped tests, `.only`, `.skip` markers) detection is not automated.

**Mitigation:** T4 noted in rules but flagged for manual review. Future enhancement: Skip detector script.

### Manual Stub Pattern Detection

**Issue:** Projects using manual stub classes (e.g., `StubSharedContext`) instead of `jest.mock()` are not detected by mock indicator scanning.

**Impact:** Classification may not flag all files needing analysis in projects with custom stubbing patterns.

**Mitigation:** Integration/e2e files are always flagged regardless of indicators. Future enhancement: Extended pattern detection for common stub conventions.

### Context Limits at Scale

**Issue:** Single sub-agent calls can handle ~20-25 test files before approaching context limits.

**Mitigation:** Batching with parallel sub-agents implemented for >20 files (classification) and >10 flagged files (detection).

---

## Related Skills

- `test-classification` - Classification prompt template
- `mock-detection` - Detection prompt template
- `subagent-prompting` - 4-part template reference
- `bug-magnet-data` - Curated edge case test data

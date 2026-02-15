# Deep Mode Detection Prompt

Use this template for Stage 2 in **Deep mode only**. In Deep mode, the detection agent self-computes classification metadata (normally provided by Stage 1) using AST output.

## GOAL

Analyze ALL provided test files for T1-T4 violations using mock appropriateness rubric and call graph analysis. For each file, self-compute classification metadata (test type, mock indicators, needs_deep_analysis) before performing detection. Track the full scope of each violation for test effectiveness calculation.

## CONSTRAINTS

- Do NOT modify any files
- Analyze ALL provided files (no classification filtering — this is Deep mode)
- Use AST metadata as ground truth for verification_lines (do not re-estimate)
- Use AST data-flow violations as starting leads for T3+ analysis
- Use AST skip markers as T4 violations (deterministic — no further analysis needed)
- Use call graph analysis to detect T1-T3 violations beyond AST leads
- Track violation scope (all affected lines, not just violation line)
- Provide full context for each violation (line, snippet, reason, fix)
- Complete within 50 tool calls per batch

## CONTEXT

**Mode:** Deep (all files analyzed, no classification stage)

**Files to analyze:** {list of ALL test files}

**AST metadata per file:**
```
{for each file}:
  file: {path}
  verification_lines: {metrics.test_logic_lines from verify-count}
  assertion_lines: {metrics.assertion_lines}
  framework: {metrics.framework_detected}
  skip_markers: {markers from skip-detect, or "none"}
  data_flow_leads: {violations from ast-analyze, or "none"}
  integration_mock_leads: {leads from npx tsx skills/test-audit/scripts/integration-mock-detector.ts, or "none"}
```

**Self-classification instructions (MANDATORY — per-section, not per-file):**

Files commonly contain multiple test types in different sections. You MUST classify each top-level describe/test block independently. DO NOT assign a single test type to the entire file.

For each top-level describe block or section:
1. **Test type**: unit / integration / e2e — determine from:
   - Block/suite name (e.g., "Integration Tests", "E2E: checkout flow")
   - Preceding comments or section headers (e.g., `// INTEGRATION TESTS`, `# E2E`, `/* system tests */`)
   - Setup patterns within the block (real DB connections = integration, browser launch = e2e)
   - These signals are language-agnostic — apply regardless of whether the file is TypeScript, Python, Java, Go, Ruby, etc.
2. **Mock indicators within that block**: list mock/stub/spy framework calls found
3. **Evaluate each block against the rubric for ITS test type** — not the file's majority type

If AST integration-mock metadata is available (from `npx tsx skills/test-audit/scripts/integration-mock-detector.ts`), use it as ground truth for section classification and mock locations. Validate AST leads and add any the AST missed.

**BINDING: AST classification is final.** When the AST script classifies a section as integration or e2e, that classification is NOT subject to LLM override. You MUST evaluate mocks in that section against integration/e2e rules — even if you believe the section is "actually" a unit test. Your role is to evaluate mock appropriateness within the classified type, not to re-classify sections.

- If the test author labeled a block "Integration" and the AST confirmed it, both the author's intent and the deterministic signal agree. Do NOT introduce personal judgment to override them.
- If you believe a section is mislabeled, you MAY note "Advisory: consider renaming this section" — but you MUST still flag T3 violations against the integration/e2e rubric.
- Dismissing an AST T3 lead by re-classifying the section as "actually unit" is a rule violation.

**Mock appropriateness rubric:** See mock-detection skill's "Mock Appropriateness Rubric" section

**T1-T4 detection patterns:** See mock-detection skill's "T1-T4 Detection Patterns" section

**Extended stub/fake patterns:** See `skills/mock-detection/references/stub-patterns.md` (loaded via mock-detection dependency)

**False positive prevention:** See `skills/mock-detection/references/false-positive-prevention.md` (loaded via mock-detection dependency) — consult BEFORE flagging borderline patterns

## OUTPUT

Write violations to: `logs/mock-detection-{YYYYMMDD-HHMMSS}.yaml`

Write diagnostics to: `logs/diagnostics/mock-detection-{YYYYMMDD-HHMMSS}.yaml`

Use the same output schema as the mock-detection skill's "Output Schema" section, with one addition — include a `self_classification` block per file:

```yaml
self_classification:
  - file: tests/proxy.test.ts
    test_type: unit
    mock_indicators: ["jest.spyOn(child_process, 'spawn')"]
    needs_deep_analysis: true
    reason: "Mock intercepts core dependency"
```

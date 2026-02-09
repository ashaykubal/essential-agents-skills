---
name: code-review
description: Comprehensive code review with distinct aspect based sections. Use when reviewing code, checking for security issues, finding type safety problems, auditing code quality, or when user asks to review code, PRs or changes. Three-phase workflow runs static tools, LLM judgment, and writes diagnostic log.
user-invocable: true
agent: sonnet
skills:
  - subagent-prompting
  - subagent-output-templating
---

# Code Review

Comprehensive code review with four independently-referenceable sections. Runs static tools first (fail fast), then applies LLM judgment for patterns tools cannot catch.

---

## When to Use This Skill

**Load this skill when the user request matches ANY of these patterns:**

| Trigger Pattern | Example User Request |
|-----------------|---------------------|
| Code review | "Review this code", "Check my changes", "Code review for PR" |
| Security review | "Check for security issues", "Find vulnerabilities", "OWASP audit" |
| Type safety check | "Find any usage", "Check type safety", "Null handling issues?" |
| Quality check | "Is this code clean?", "Check code quality", "Standards compliance" |

**DO NOT use for:**
- Running tests (use `just test`)
- Auditing test quality (use `test-audit` skill)
- Debugging issues (use `issue-debugging` skill)
- Performance profiling (requires runtime analysis)

---

## Dependencies

This skill references supporting files. Understanding what's required vs optional ensures consistent execution.

| Category | Files | Requirement | When to Load |
|----------|-------|-------------|--------------|
| **Pattern references** | `references/{section}-patterns.md` | **REQUIRED** | Always load for each enabled section |
| **Framework patterns** | `frameworks/{detected}.md` | **CONDITIONALLY REQUIRED** | If framework detected → MUST load; if not detected → skip |
| **Examples** | `examples/anti-patterns/*.ts`, `examples/recommended/*.ts` | OPTIONAL | For calibration on ambiguous cases; kept for model portability |

**Fallback behavior:**
- If framework detected → Loading `frameworks/{name}.md` is REQUIRED
- If no framework detected → Skip framework patterns entirely (do not load `generic.md`)
- If a referenced file is missing → Note in diagnostic log, continue with available patterns

---

## Usage

```
/code-review [path] [flags]
```

**Arguments:**
- `path` - File or directory to review (default: files in recent context)

**Flags:**
- `--quick` - Tiered review by change size (Security-only for <50 lines)
- `--framework=<name>` - Override auto-detected framework (react|express|django|generic)
- `--include-git-context` - Include git history for complexity findings
- `--section=<name>` - Run single section only (security|type-safety|linting|standards)

**Examples:**
- `/code-review src/auth/` - Full review of auth directory
- `/code-review src/api.ts --quick` - Quick review (tiered by lines)
- `/code-review src/ --section=security` - Security section only

---

## Three-Phase Workflow

**CRITICAL**: All three phases are REQUIRED. Do not skip any phase.

```
Phase 1: Static Analysis (Deterministic)
├── Run: just typecheck → capture output
├── Run: just lint → capture output
└── If failures: STOP, return to user (fail fast)

Phase 2: LLM Review (Judgment-Based)
├── Load references/{section}-patterns.md for each enabled section (REQUIRED)
├── If framework detected: Load frameworks/{detected}.md (REQUIRED)
├── If no framework detected: Skip framework patterns
├── Apply each enabled section using loaded patterns
└── Output findings to user

Phase 3: Write Diagnostic Log (REQUIRED)
├── Write to: logs/diagnostics/code-review-{timestamp}.yaml
├── Include: invocation details, static analysis results, findings summary
└── This phase is MANDATORY - do not return to user without completing it
```

**Why Phase 1 First:**
- Saves tokens (don't analyze code that won't compile)
- Eliminates false positives (LLM doesn't rediscover tool findings)
- Fail fast on obvious issues

**Why Phase 3 is Required:**
- Enables pipeline orchestration to collect sub-agent outputs
- Provides observability for multi-agent workflows
- Creates audit trail for code review decisions

---

## Sections

Each section is independently referenceable by pipeline agents via `--section=<name>`.

### Quick Reference

| Section | Boundary | Key Patterns | Severity Range |
|---------|----------|--------------|----------------|
| Security | Threats & exploits | OWASP Top 10, injection, auth | Critical-Important |
| Type Safety | Type system holes | `any`, null, unsafe assertions | Critical-Important |
| Linting | Style requiring judgment | Complexity, naming, structure | Important-Suggestion |
| Coding Standards | Conventions & architecture | Patterns, documentation | Important-Suggestion |

---

## Security

### Purpose
Identify security vulnerabilities that static analysis cannot catch.

### Boundary
Threats and exploits: authentication/authorization logic, injection patterns, secrets exposure, CSRF, CORS misconfigurations.

**Does NOT cover:** Type errors (→ Type Safety), code style (→ Linting).

### Prerequisites
- `just typecheck` passed
- `just lint` passed

### Patterns (REQUIRED)
Load `references/security-patterns.md` for:
- OWASP Top 10 checklist with detection criteria
- Framework-specific patterns (from `frameworks/{detected}.md` if framework detected)

### Examples (OPTIONAL - for calibration)
Reference when encountering ambiguous cases:
- Anti-patterns: `examples/anti-patterns/security.ts`
- Recommended: `examples/recommended/security.ts`

### What to Skip (Common False Positives)
- Parameterized queries flagged due to nearby string concatenation
- Test fixtures with intentional "vulnerable" code
- Comments containing SQL/code examples
- Sanitization already applied upstream

### Output Requirements
- confidence: verified | suspected
- evidence: Data flow trace or pattern match
- owasp: Category reference (e.g., A03:2021-Injection)

---

## Type Safety

### Purpose
Identify type system holes that bypass compile-time safety.

### Boundary
Type system integrity: explicit `any`, implicit any from missing types, unsafe type assertions, null/undefined handling gaps.

**Does NOT cover:** Runtime errors from logic bugs (→ tests), security issues (→ Security).

### Prerequisites
- `just typecheck` passed (confirms type-correct, looking for holes)

### Patterns (REQUIRED)
Load `references/type-safety-patterns.md` for:
- `any` usage patterns (explicit, implicit, from libraries)
- Null handling patterns (optional chaining gaps, assertion misuse)
- Unsafe assertion patterns (as unknown as T, non-null assertion operator)

### Examples (OPTIONAL - for calibration)
Reference when encountering ambiguous cases:
- Anti-patterns: `examples/anti-patterns/type-safety.ts`
- Recommended: `examples/recommended/type-safety.ts`

### What to Skip (Common False Positives)
- `any` in test fixtures for flexibility
- `any` in JSON parsing with immediate validation
- Third-party library types that require `any`
- Intentional `as const` assertions

### Output Requirements
- pattern: any_explicit | any_implicit | null_gap | unsafe_assertion
- location: Precise line and column

---

## Linting

### Purpose
Identify code quality issues requiring human judgment beyond what automated linters catch.

### Boundary
Style and structure requiring judgment: cyclomatic complexity, semantic naming, deep nesting, code duplication, unclear control flow.

**Does NOT cover:** Formatting (automated), syntax (compiler), security (→ Security).

### Prerequisites
- `just lint` passed (catches automatable issues)

### Patterns (REQUIRED)
Load `references/linting-patterns.md` for:
- Complexity thresholds (cyclomatic, nesting depth, function length)
- Naming anti-patterns (single letters, generic names, misleading names)
- Structure anti-patterns (god functions, mixed concerns)

### Examples (OPTIONAL - for calibration)
Reference when encountering ambiguous cases:
- Anti-patterns: `examples/anti-patterns/linting.ts`
- Recommended: `examples/recommended/linting.ts`

### What to Skip (Common False Positives)
- Intentionally complex algorithms with comments
- Generated code with unusual patterns
- Legacy code explicitly marked for future refactoring
- Single-letter variables in tight loops (`i`, `j`, `k`)

### Git Context (Optional)
When `--include-git-context` is enabled, include for complexity findings:
```yaml
git_context:
  last_modified: "2025-08-15 by @alice"
  commit_message: "Workaround for #1234"
  note: "Complexity may be intentional - verify before refactoring"
```

### Output Requirements
- pattern: deep_nesting | long_function | generic_naming | god_function
- metrics: Quantitative values where applicable (nesting level, line count)

---

## Coding Standards

### Purpose
Verify adherence to project conventions and architectural patterns.

### Boundary
Conventions and architecture: atomic principles (single responsibility, explicit I/O), documentation quality, pattern adherence, consistency with codebase.

**Does NOT cover:** Style formatting (→ linters), security patterns (→ Security).

### Prerequisites
- Code compiles and passes lint

### Patterns (REQUIRED)
Load `references/standards-patterns.md` for:
- Atomic principles checklist (CS1-CS4 from Rules.md)
- Documentation requirements (when to document, JSDoc format)
- Pattern consistency checks

### Examples (OPTIONAL - for calibration)
Reference when encountering ambiguous cases:
- Anti-patterns: `examples/anti-patterns/standards.ts`
- Recommended: `examples/recommended/standards.ts`

### What to Skip (Common False Positives)
- Prototype/experimental code explicitly marked
- Third-party integration code matching external patterns
- Auto-generated code (migrations, schemas)

### Output Requirements
- principle: cs1_single_responsibility | cs2_no_magic | cs3_fail_fast | cs4_clean_code
- reference: Link to documentation or pattern definition

---

## Framework Detection

Auto-detect framework from project files. **If detected, loading framework patterns is REQUIRED.**

### Detection Logic

```
package.json dependencies → Framework
─────────────────────────────────────
react, next, gatsby       → react
express, fastify, koa     → express
@angular/core             → angular
vue, nuxt                 → vue

requirements.txt / pyproject.toml:
django                    → django
flask                     → flask
fastapi                   → fastapi

(none of above)           → (no framework)
```

### Override
Use `--framework=<name>` to override detection.

### Fallback Behavior
If no framework is detected:
- **Do NOT load `generic.md`** - skip framework patterns entirely
- Continue with core patterns from `references/*.md` files (which are REQUIRED)
- Note in diagnostic log that framework-specific checks were skipped

---

## Quick Mode

When `--quick` flag is specified, sections are tiered by lines changed:

| Lines Changed | Sections Run |
|---------------|--------------|
| <50 lines | Security only |
| 50-500 lines | Security + Type Safety |
| >500 lines | All sections |

**Default (no flag):** All sections (comprehensive review).

---

## Severity Tiers

| Tier | Label | Criteria | Action |
|------|-------|----------|--------|
| **CRITICAL** | Must fix before merge | Security vulnerabilities, type safety holes causing runtime errors | Block merge |
| **IMPORTANT** | Should fix | Anti-patterns, missing tests, significant quality issues | Address before or after merge |
| **SUGGESTION** | Optional | Style improvements, naming clarity, minor refactoring | Consider for future |

---

## Confidence Levels

| Level | Label | Criteria |
|-------|-------|----------|
| **Verified** | Data flow traced, exploit path confirmed | "User input from req.query.id flows to db.query at line 45 without sanitization" |
| **Suspected** | Pattern matches but context unclear | "String concatenation in SQL-like context - verify if this is actually a query" |

---

## Output Format

Output templates follow the `subagent-output-templating` skill structure with skill-specific extensions for code review findings.

### Direct Invocation
Use template from `templates/output-direct.yaml`:
- Summary with counts by severity
- Findings grouped by severity
- Each finding has: file, line, section, pattern, confidence, evidence, description, why, fix

### Pipeline Stage
Use template from `templates/output-pipeline.yaml`:
- Scoped to single section
- Findings list with severity
- Summary statement
- Gate pass/fail for pipeline orchestration

---

## Pipeline Integration

### As Full Auditor
```fsharp
code-auditor
├── context: fork (isolated review)
├── skills: code-review
└── Runs all 4 sections, never fixes
```

### As Pipeline Stage (role-based)
```fsharp
SecurityReviewer (--section=security)
|> TypeSafetyReviewer (--section=type-safety)
|> LintReviewer (--section=linting)
|> StandardsReviewer (--section=standards)
|> ReviewSynthesizer (consolidate)
```

> **Note:** Additional pipeline orchestration available in [The Bulwark](https://github.com/ashaykubal/the-bulwark) framework.

---

## Diagnostic Output (REQUIRED)

**MANDATORY**: You MUST write diagnostic output after every review. This is Phase 3 of the workflow and cannot be skipped.

**Standard**: Follows `subagent-output-templating` diagnostic format.

Write diagnostic output to:
```
logs/diagnostics/code-review-{timestamp}.yaml
```

Format:
```yaml
diagnostic:
  skill: code-review
  timestamp: 2026-01-31T12:00:00Z
  invocation:
    mode: comprehensive | quick
    sections_run: [security, type_safety, linting, standards]
    framework_detected: react
    framework_override: null
    files_count: 5
    lines_total: 450
  static_analysis:
    typecheck: passed | failed | skipped
    lint: passed | failed | skipped
  findings_summary:
    critical: 1
    important: 3
    suggestion: 5
  duration_ms: 1200
```

---

## Completion Checklist

**IMPORTANT**: Before returning to the user, verify ALL items are complete:

- [ ] Phase 1: Static analysis ran (`just typecheck`, `just lint`)
- [ ] Phase 2: LLM review completed for all enabled sections
- [ ] Phase 2: Findings delivered to user (console output)
- [ ] Phase 3: Diagnostic log written to `logs/diagnostics/code-review-{timestamp}.yaml`

**Do NOT return to user until all checkboxes can be marked complete.**

# Specialization: Code Review

This reference guides the code-review Analyzer on what improvement patterns to look for in collected learnings.

## Target Skill Structure

The code-review skill (`skills/code-review/` or `.claude/skills/code-review/`) typically contains:

| Component | Purpose |
|-----------|---------|
| `SKILL.md` | Main skill document with 3-phase pipeline (static tools, LLM judgment, diagnostic log) |
| `references/security-patterns.md` | Security vulnerability detection patterns (OWASP, injection, etc.) |
| `references/type-safety-patterns.md` | Type safety review patterns |
| `references/coding-standards.md` | Coding standards enforcement patterns |
| `references/framework-patterns.md` | Framework-specific review patterns |

## What to Look For

### Security Pattern Gaps

Learnings that reveal security patterns not currently covered:

- New vulnerability types encountered during code review or debugging
- OWASP patterns missing from security references
- Framework-specific security concerns (e.g., WSL path traversal, CRLF injection)
- Supply chain or dependency vulnerabilities discovered

**Action**: Propose additions to `references/security-patterns.md` with specific vulnerability descriptions and detection heuristics.

### Framework Pattern Updates

Learnings about framework behaviors that affect code review:

- New framework conventions or anti-patterns discovered
- Hook system behaviors that the review should check for
- Configuration patterns that indicate quality issues
- Build system quirks (e.g., CRLF on WSL, executable bit issues)

**Action**: Propose additions to `references/framework-patterns.md` with concrete examples.

### Review Lens Improvements

Learnings about the review process itself:

- Cases where the review missed an issue that was later found in testing
- Patterns where reviewer bias led to false positives or negatives
- New review dimensions not covered by current lenses
- Effectiveness of static tools vs LLM judgment for specific pattern types

**Action**: Propose review lens updates or new review categories in `SKILL.md`.

### Type Safety Enhancements

Learnings about type safety patterns:

- New TypeScript patterns that indicate type unsafety
- Cases where `any` or type assertions masked real issues
- Generics patterns that improve or degrade type safety
- Runtime type validation patterns at system boundaries

**Action**: Propose additions to `references/type-safety-patterns.md` with violation and fix examples.

### Instruction Hardening

Learnings about LLM compliance with code-review instructions:

- Cases where the reviewer skipped steps or produced incomplete output
- Missing BINDING language that allowed instruction drift
- Stage sequencing issues (e.g., LLM judgment running before static tools)
- Output format compliance gaps

**Action**: Propose instruction strengthening with specific MUST/MUST NOT language.

## Analysis Output Structure

For each improvement identified, produce:

1. **What was learned** — the specific learning item(s) driving this
2. **What it affects** — which code-review component (reference file, SKILL.md section)
3. **Proposed improvement** — specific enough for the Proposer to create a copy-paste-ready change
4. **Priority** — High (current misses cause real failures), Medium (improves coverage), Low (nice to have)
5. **Evidence** — reference the source learning item IDs (L-NNN)

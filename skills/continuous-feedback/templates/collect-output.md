---
run_slug: "{run-slug}"
target: "{target skill or path}"
sources:
  session_handoffs: "{count}"
  memory_files: "{count}"
  custom_paths: "{count}"
since: "{session-N or 'all'}"
total_items: "{count}"
skill_types_detected:
  - "{skill-type-1}"
  - "{skill-type-2}"
---

# Collected Learnings — {target}

## Collection Summary

| Source Type | Files Scanned | Items Extracted |
|-------------|---------------|-----------------|
| Session handoffs | {count} | {count} |
| MEMORY.md | {count} | {count} |
| Agent memory | {count} | {count} |
| Custom paths | {count} | {count} |

**Skill types detected in learnings**: {comma-separated list}

## Learning Items

```yaml
items:
  - id: L001
    source: "{filename}"
    section: "{section header where found}"
    category: "{category}"  # defect-pattern | architecture-decision | framework-observation | workflow-improvement | tool-behavior
    skill_relevance:
      - "{skill-type}"  # test-audit | code-review | general | other detected types
    content: |
      {Full learning text preserved with surrounding context.
      Multiple sentences retained for downstream actionability.
      No lossy compression — Analyzers handle interpretation.}

  - id: L002
    source: "{filename}"
    section: "{section header}"
    category: "{category}"
    skill_relevance:
      - "{skill-type-1}"
      - "{skill-type-2}"
    content: |
      {Full learning text. Items may be relevant to multiple skills.}
```

## Category Definitions

| Category | What It Captures | Example |
|----------|-----------------|---------|
| defect-pattern | Bugs, failures, and their fixes | "DEF-P4-005: Claude ignores skill instructions without binding language" |
| architecture-decision | Design choices and their rationale | "P4.4 implementer uses Opus with implementer-quality.sh" |
| framework-observation | Claude Code platform behaviors | "Agent-scoped hooks in frontmatter DO NOT fire" |
| workflow-improvement | Process or pipeline enhancements | "Pre-brainstorm alignment eliminates post-synthesis rounds" |
| tool-behavior | Tool quirks, limitations, or capabilities | "gh CLI defaults SSH remote even with HTTPS auth" |

## Skill Relevance Classification

The `skill_relevance` field is LLM-classified based on content analysis, not keyword matching. Classification guidelines:

- **test-audit**: Learnings about mock detection, test classification, assertion patterns, AST analysis, T1-T4 rules
- **code-review**: Learnings about security patterns, review lenses, pipeline stages, coding standards enforcement
- **general**: Learnings about skill authoring, prompt engineering, sub-agent behavior, workflow patterns, hook behavior
- Items may have multiple skill_relevance tags when they span domains
- When uncertain, include "general" as a fallback tag

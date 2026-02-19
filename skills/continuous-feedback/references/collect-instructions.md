# Collection Instructions

These instructions guide the Collector sub-agent on how to parse input sources and extract learning items.

## Input Sources

### Session Handoffs (`sessions/*.md`)

Session handoff files follow a consistent structure. Extract learning items from these sections:

| Section Header | What to Extract | Category Mapping |
|----------------|-----------------|------------------|
| `## Learnings` | Bullet points describing what was learned | defect-pattern, workflow-improvement, tool-behavior |
| `## Technical Decisions` | Design choices with rationale | architecture-decision |
| `## Blockers / Issues` | Problems encountered and resolutions | defect-pattern, framework-observation |
| `## What Was Accomplished` | Completed work items (extract patterns, not status) | workflow-improvement |
| `## Verification Status` | Test/validation outcomes revealing gaps | defect-pattern |

**Parsing approach:**
1. Use Grep to locate section headers (`^## Learnings`, `^## Technical Decisions`, etc.)
2. Use Read with offsets to extract content between section headers
3. Each bullet point or decision block becomes one learning item
4. Preserve the full text of each item including surrounding context sentences

**Session windowing:** When `--since` is specified, only process session files with session number >= N. Session number is extracted from filename: `session_{N}_*.md`.

### Project MEMORY.md

MEMORY.md is a curated summary that persists across sessions. Extract from these sections:

| Section Header | What to Extract | Category Mapping |
|----------------|-----------------|------------------|
| `## Defects & Lessons Learned` | Defect patterns and their fixes | defect-pattern |
| `## Architecture Decisions` | Design choices | architecture-decision |
| `## Framework Observations` | Platform behaviors | framework-observation |
| `## Critical Findings` | Cross-cutting discoveries | defect-pattern, tool-behavior |
| `## Hook Behavior` | Hook system behaviors | framework-observation, tool-behavior |
| `## Key Patterns` | Workflow conventions | workflow-improvement |

**Parsing approach:**
1. Read MEMORY.md in full (it's curated and concise)
2. Each bold-prefixed bullet (e.g., `**DEF-P4-005**:`) is one learning item
3. Preserve the full text including any sub-bullets

### Agent Memory Files (`.claude/agent-memory/*/MEMORY.md`)

When available, these contain agent-specific learnings. Parse using the same approach as project MEMORY.md.

### Custom Paths (`--sources`)

When custom paths are provided:
1. If path is a file: read and extract any structured learning content
2. If path is a directory: scan for `.md` files and apply session handoff parsing rules
3. Look for the same section headers as session handoffs
4. If no recognized headers found, treat entire file content as a single learning item with category "workflow-improvement"

## Skill Relevance Classification

After extracting each learning item, classify which skills it could improve. This is an LLM judgment task, not keyword matching.

### Classification Guidelines

| Skill Type | Indicators in Content |
|------------|----------------------|
| test-audit | Mock detection, test classification, assertion patterns, AST analysis, T1-T4 rules, test mode selection, verification line counting |
| code-review | Security patterns, review lenses, pipeline stages, coding standards, OWASP, type safety, framework conventions |
| general | Skill authoring, prompt engineering, sub-agent behavior, workflow patterns, hook behavior, configuration, frontmatter, token management |

**Multi-tag rule**: A learning item may be relevant to multiple skills. Assign all applicable tags. When uncertain, include "general" as a fallback.

**Do NOT use keyword matching.** The sentence "Mock return values used as literal inputs violate T3" is relevant to `test-audit` even though it doesn't contain the word "test-audit". Classify based on what the learning would improve, not which words appear in it.

## Output Requirements

1. Write output to the path specified in the GOAL
2. Use the collect-output template structure
3. Assign sequential IDs (L001, L002, ...) to each item
4. Group items by source file for readability
5. Include the YAML header with counts and detected skill types
6. If a source file has no extractable learnings, skip it silently
7. If total items extracted is 0, write an output file stating "No learning items found in scanned sources" — the orchestrator will handle the empty result

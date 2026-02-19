---
run_slug: "{run-slug}"
target: "{target skill or path}"
total_proposals: "{count}"
priority_distribution:
  high: "{count}"
  medium: "{count}"
  low: "{count}"
source_analyses:
  - "{specialization-1}"
  - "{specialization-2}"
---

# Improvement Proposals — {target}

## Proposal Summary

| # | Title | Target File | Change Type | Priority |
|---|-------|-------------|-------------|----------|
| 1 | {title} | {file path} | Add/Modify/Remove | High/Medium/Low |
| 2 | {title} | {file path} | Add/Modify/Remove | High/Medium/Low |

---

## Proposed Change 1: {Short descriptive title}

**Target**: {exact file path, e.g., `.claude/skills/test-audit/references/mock-detection-patterns.md`}
**Change type**: Add | Modify | Remove
**Section**: {target section within file, or "New section"}
**Priority**: High | Medium | Low
**Source learnings**: {L-IDs and session/memory references that drive this proposal}

### Proposed content:

{The actual text to add or the modified text. Copy-paste ready.
This MUST be specific enough to apply without interpretation.
Include exact markdown formatting, headers, and content.}

### Rationale:

{Why this improves the skill, traced to specific learning items.
Reference specific L-IDs from the Collector output.}

### Validation:

{How to verify this change works. Examples:
- "Run /anthropic-validator on {target file}"
- "Re-run test-audit on fixture X and verify new pattern detected"
- "Run your project typecheck, lint, and test commands"}

---

## Quality Criteria for Proposals

### Good Proposal Example

> **Target**: `skills/test-audit/references/mock-detection-patterns.md`
> **Section**: `## Return Value Fabrication`
> **Proposed content**:
> ```markdown
> ### Property-Access Chain Detection
>
> When test code extracts a property from a mock return value and uses it
> to construct a new object, this is a T3 violation:
>
> ```typescript
> // VIOLATION: mockOrder.id used to construct new object
> const mockOrder = { id: 'order-123', status: 'pending' };
> const input = { orderId: mockOrder.id, quantity: 5 };
> const result = processOrder(input);
> ```
> ```

### Bad Proposal Example

> **Target**: `skills/test-audit/`
> **Proposed content**: "Improve mock detection to catch more patterns"

This is too vague. It provides no actionable content, no specific file, and no copy-paste ready text.

### Proposal Completeness Checklist

- [ ] Target is an exact file path (not a directory)
- [ ] Change type is specified (Add/Modify/Remove)
- [ ] Section identifies exactly where in the file
- [ ] Proposed content is copy-paste ready
- [ ] Rationale references specific learning items
- [ ] Validation describes a concrete verification step

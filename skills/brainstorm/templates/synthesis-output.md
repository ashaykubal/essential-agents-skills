---
topic: {topic}
phase: brainstorm
mode: scoped | exploratory
agents_synthesized: "{count}"  # 5 for scoped, 4 for exploratory
overall_verdict: proceed | modify | defer | kill
verdict_source: critical-analyst
---

# {Topic} — Brainstorm Synthesis

## Consensus Areas

{Where all roles agree — foundation for implementation}

| Area | Supporting Roles | Confidence |
|------|-----------------|------------|
| {area} | SME, PM, Architect, Dev Lead, Critic | HIGH |

## Divergence Areas

{Where roles disagree — requires decision}

### {Divergence 1}

- **{Role A}**: {position}
- **{Role B}**: {position}
- **Decision needed**: {what must be decided}

## Debate Dynamics (--exploratory only)

{Remove this section entirely for --scoped mode.}

{Capture how the AT peer debate shaped the analysis:}
- {Where teammates explicitly challenged each other}
- {Positions that evolved during debate (cite Post-Debate Update sections)}
- {Unresolved disagreements that require user decision}

## Critical Analyst Verdict

**Verdict**: {proceed / modify / defer / kill}
**Confidence**: {high / medium / low}
**Conditions**: {conditions for verdict to hold}

## Problem Validation

{From Critical Analyst's Problem Validation section — should this problem be solved at all?}

## Implementation Outline

{High-level approach combining Architect's design, delivery plan, and priorities}

### v1 Scope

{What is in v1, what is deferred}

### Architecture (from Architect)

{How it fits together}

### Build Plan

{Ordering, dependencies, effort}

## Risks and Mitigations

{Consolidated from all roles, prioritized by Critical Analyst}

| Risk | Source Role | Severity | Mitigation |
|------|-----------|----------|------------|
| {risk} | Dev Lead | HIGH | {mitigation} |

## Open Questions

{What needs user decision before proceeding}

1. {question}
2. {question}

## Incomplete Coverage

{Document any agent failures or gaps here. Remove this section if all agents completed successfully.}

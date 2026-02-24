---
role: qa-critic
topic: "{topic}"
verdict: APPROVE | MODIFY | REJECT
verdict_confidence: high | medium | low
conditions:
  - "{condition for verdict to hold}"
key_challenges:
  - "{challenge 1}"
  - "{challenge 2}"
---

# QA / Critic Review

**Topic:** {refined problem statement}
**Timestamp:** {ISO-8601}
**Inputs reviewed:** Product Owner, Technical Architect, Engineering & Delivery Lead

## Assumption Challenges

{What are the other roles assuming that might be wrong? List each assumption, its source role, and why it may not hold.}

| Assumption | Source | Risk if Wrong |
|------------|--------|---------------|
| {assumption} | {role} | {consequence} |

## Gap Analysis

{What has been overlooked? Cross-reference PO requirements against Architect components and Eng Lead workpackages. Identify coverage gaps.}

## Estimate Stress Test

{Challenge the Eng Lead's effort estimates. Are dependencies realistic? Are parallel opportunities truly independent? What historical evidence supports or contradicts the estimates?}

## Simpler Alternatives

{Could a less ambitious approach deliver the core value? What is the minimum viable scope?}

## Kill Criteria

{Under what conditions should this plan be abandoned or significantly restructured?}

1. {condition}
2. {condition}

## Validation Plan

**Tiered verification approach:**

| Tier | Scope | When to Run |
|------|-------|-------------|
| Tier 1 | {smoke test} | After each workpackage |
| Tier 2 | {integration test} | After each phase |
| Tier 3 | {end-to-end validation} | Before milestone sign-off |

## Verdict

**{APPROVE / MODIFY / REJECT}** (Confidence: {high / medium / low})

{Detailed justification. If MODIFY, list specific required changes. If REJECT, state what would need to change for reconsideration.}

### Conditions for Verdict to Hold

- {condition 1}
- {condition 2}

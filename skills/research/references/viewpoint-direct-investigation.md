# Viewpoint: Direct Investigation

## Core Question

What is this? How does it work? What is the current state of the art?

## Focus Areas

- Define the concept precisely — what it is and what it is not
- How it works mechanically (architecture, data flow, lifecycle)
- Current state of the art — who uses it, what tooling exists
- Official documentation, specifications, or standards
- Key terminology and taxonomy

## Prompt Template

```
GOAL: Research [{topic}] from the Direct Investigation perspective. Produce a
comprehensive technical analysis covering definition, mechanics, state of the art,
and key terminology.

CONSTRAINTS:
- Focus exclusively on the Direct Investigation lens — other viewpoints are handled
  by parallel agents
- Be evidence-based: cite sources, examples, or reasoning for each claim
- Flag confidence levels: HIGH (verified/multiple sources), MEDIUM (single
  source/strong reasoning), LOW (inference/limited data)
- Do not pad findings — "I couldn't find evidence for X" is a valid and valuable finding
- Target 1000-1500 words

REASONING DEPTH — Research-Evaluate-Deepen:
You MUST follow this multi-pass process (do not skip to writing the final output):

1. INITIAL RESEARCH: Conduct your first pass — web searches, codebase exploration,
   document reads. Gather raw findings.
2. EVALUATE: Review what you found. For each finding, explicitly state:
   - The claim
   - Supporting evidence
   - Counterevidence or caveats
   - Your net assessment
3. IDENTIFY GAPS: What are the 2-3 most important questions your initial research
   did NOT answer? What uncertainties remain?
4. DEEPEN: Conduct a second targeted research pass focused specifically on those
   gaps. Search for counterexamples, edge cases, or missing context.
5. RECONCILE: Document what changed between your initial findings and your deepened
   findings. Did any initial conclusions shift? Flag these explicitly.

Only after completing all 5 steps, write your final output using the template below.

CONTEXT:
{topic_description}
{user_provided_context}
{scope_boundaries}

OUTPUT:
Write findings to: {output_path}
Use the output template provided below for document structure.
Use YAML header with: viewpoint, topic, confidence_summary, key_findings (3-5 bullets)
Follow with detailed analysis organized by the focus areas above.

{viewpoint_output_template}
```

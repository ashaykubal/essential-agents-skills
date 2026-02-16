# Viewpoint: Contrarian Angle

## Core Question

What failure modes and risks do most people overlook?

## Focus Areas

- Failure modes that advocates rarely mention
- Scenarios where this approach is the wrong choice
- Hidden costs (complexity, maintenance burden, cognitive load)
- Alternatives that might be simpler or more appropriate
- When NOT to use this

## Prompt Template

```
GOAL: Research [{topic}] from the Contrarian Angle. Identify failure modes,
hidden costs, and scenarios where this approach is the wrong choice. Challenge
the prevailing narrative.

CONSTRAINTS:
- Focus exclusively on the Contrarian lens — other viewpoints are handled
  by parallel agents
- Be genuinely critical, not performatively contrarian — ground critiques in evidence
- Flag confidence levels: HIGH (verified/multiple sources), MEDIUM (single
  source/strong reasoning), LOW (inference/limited data)
- Do not pad findings — "I couldn't find evidence for X" is a valid and valuable finding
- Target 1000-1500 words

REASONING DEPTH — Research-Evaluate-Deepen:
You MUST follow this multi-pass process (do not skip to writing the final output):

1. INITIAL RESEARCH: Conduct your first pass — search for criticisms, failure cases,
   abandoned projects, and dissenting opinions. Gather raw contrarian evidence.
2. EVALUATE: Review what you found. For each finding, explicitly state:
   - The critique
   - Supporting evidence (specific failures, measurable costs, real examples)
   - Counterargument (how advocates respond to this critique)
   - Your net assessment (is the critique valid despite the counterargument?)
3. IDENTIFY GAPS: What are the 2-3 failure modes or risks that NEITHER advocates
   NOR critics seem to discuss? What blind spots exist in the discourse?
4. DEEPEN: Conduct a second targeted research pass focused on those blind spots.
   Look for adjacent domains where similar patterns failed for non-obvious reasons.
5. RECONCILE: Document what changed between your initial critiques and your deepened
   analysis. Did any critiques turn out to be weaker than expected? Did new risks
   emerge that are more important than the commonly cited ones?

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

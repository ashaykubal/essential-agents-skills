# Viewpoint: Prior Art / Historical

## Core Question

What similar patterns have existed before? What can we learn from their trajectory?

## Focus Areas

- Historical predecessors and analogous patterns
- How similar approaches evolved over time
- What succeeded and why; what failed and why
- Patterns that were hyped then abandoned vs. patterns that became foundational
- Lessons applicable to the current topic

## Prompt Template

```
GOAL: Research [{topic}] from the Prior Art / Historical perspective. Analyze
historical predecessors, their trajectories, and lessons applicable to how we
should approach this topic today.

CONSTRAINTS:
- Focus exclusively on the Prior Art lens — other viewpoints are handled
  by parallel agents
- Draw genuine historical parallels, not superficial analogies
- Flag confidence levels: HIGH (verified/multiple sources), MEDIUM (single
  source/strong reasoning), LOW (inference/limited data)
- Do not pad findings — "I couldn't find evidence for X" is a valid and valuable finding
- Target 1000-1500 words

REASONING DEPTH — Research-Evaluate-Deepen:
You MUST follow this multi-pass process (do not skip to writing the final output):

1. INITIAL RESEARCH: Conduct your first pass — identify historical predecessors,
   analogous patterns from other domains, and evolution trajectories. Cast a wide
   net across computing history and adjacent fields.
2. EVALUATE: Review each historical parallel. For each:
   - The predecessor and why it's relevant
   - How it succeeded or failed (with specific evidence)
   - The lesson applicable to the current topic
   - How strong the analogy is (direct parallel vs. loose similarity)
3. IDENTIFY GAPS: What are the 2-3 historical patterns you suspect exist but
   couldn't find? What eras or domains haven't you checked?
4. DEEPEN: Conduct a second targeted research pass focused on those gaps. Look for
   less obvious predecessors — patterns from other industries, abandoned research
   directions, or solutions that were ahead of their time.
5. RECONCILE: Document what changed between your initial historical survey and your
   deepened analysis. Did any "new" ideas turn out to have well-documented
   predecessors? Did any historical "failures" turn out to be timing issues rather
   than fundamental flaws?

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

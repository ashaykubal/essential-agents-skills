# Viewpoint: First Principles

## Core Question

What core problem does this solve? What is the minimal viable version?

## Focus Areas

- The fundamental problem being addressed (stripped of buzzwords)
- Why existing approaches are insufficient
- The minimal set of capabilities needed to solve the core problem
- What can be deferred vs. what is essential
- Decomposition into independent sub-problems

## Prompt Template

```
GOAL: Research [{topic}] from First Principles. Break it down to the fundamental
problem it solves, identify the minimal viable version, and decompose into
independent sub-problems.

CONSTRAINTS:
- Focus exclusively on the First Principles lens — other viewpoints are handled
  by parallel agents
- Strip away buzzwords and marketing — focus on the underlying problem
- Flag confidence levels: HIGH (verified/multiple sources), MEDIUM (single
  source/strong reasoning), LOW (inference/limited data)
- Do not pad findings — "I couldn't find evidence for X" is a valid and valuable finding
- Target 1000-1500 words

REASONING DEPTH — Research-Evaluate-Deepen:
You MUST follow this multi-pass process (do not skip to writing the final output):

1. INITIAL RESEARCH: Conduct your first pass — strip the topic to its core problem.
   What fundamental need does this address? Research the problem space, not just
   the proposed solution.
2. EVALUATE: Review your decomposition. For each sub-problem identified:
   - The sub-problem statement
   - Why existing approaches fail to solve it
   - The minimal capability needed to address it
   - Whether this sub-problem is truly essential or a nice-to-have
3. IDENTIFY GAPS: What are the 2-3 assumptions in your decomposition that you
   haven't validated? Are you sure the problem is what it appears to be?
4. DEEPEN: Conduct a second targeted research pass. Look for cases where the
   "obvious" problem was actually a symptom of a different root cause. Check
   whether simpler framings of the problem exist.
5. RECONCILE: Document what changed between your initial decomposition and your
   deepened analysis. Did the problem turn out to be simpler or more complex than
   initially framed?

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

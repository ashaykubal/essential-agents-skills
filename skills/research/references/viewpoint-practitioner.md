# Viewpoint: Practitioner Perspective

## Core Question

How do teams actually use this in production? What works and what doesn't?

## Focus Areas

- Real-world adoption patterns — who uses this and how
- Common implementation approaches and their trade-offs
- Practical gotchas that documentation doesn't cover
- Operational concerns (debugging, monitoring, maintenance)
- Team skill requirements and learning curves

## Prompt Template

```
GOAL: Research [{topic}] from the Practitioner Perspective. Describe how teams
actually use this in production — what works well, what's harder than expected,
and what operational concerns arise.

CONSTRAINTS:
- Focus exclusively on the Practitioner lens — other viewpoints are handled
  by parallel agents
- Draw on real-world usage patterns, not theoretical capabilities
- Flag confidence levels: HIGH (verified/multiple sources), MEDIUM (single
  source/strong reasoning), LOW (inference/limited data)
- Do not pad findings — "I couldn't find evidence for X" is a valid and valuable finding
- Target 1000-1500 words

REASONING DEPTH — Research-Evaluate-Deepen:
You MUST follow this multi-pass process (do not skip to writing the final output):

1. INITIAL RESEARCH: Conduct your first pass — web searches, community discussions,
   blog posts, production case studies. Gather raw practitioner experiences.
2. EVALUATE: Review what you found. For each finding, explicitly state:
   - The claim (e.g., "Teams report X works well")
   - Supporting evidence (specific examples, team sizes, contexts)
   - Counterevidence or caveats (who reports it does NOT work?)
   - Your net assessment
3. IDENTIFY GAPS: What are the 2-3 most important practical questions your initial
   research did NOT answer? What operational concerns remain unclear?
4. DEEPEN: Conduct a second targeted research pass focused on those gaps. Look for
   failure post-mortems, migration stories, or "lessons learned" content.
5. RECONCILE: Document what changed between your initial findings and your deepened
   findings. Did any "best practices" turn out to have significant caveats?

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

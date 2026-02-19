# Specialization: General

This reference guides the general Analyzer on what improvement patterns to look for in collected learnings. The general Analyzer is the catch-all — it processes learnings that don't fit neatly into test-audit or code-review, plus any items tagged with "general" skill_relevance.

## Target Scope

The general Analyzer examines improvements for ANY skill or agent in the project, including:

- Skill authoring patterns (frontmatter, structure, instructions)
- Sub-agent behavior and prompt engineering
- Pipeline orchestration patterns
- Hook system configuration and behavior
- Session workflow and handoff patterns
- Token management and context window optimization
- Template and reference document conventions

## What to Look For

### Instruction Hardening (DEF-P4-005 Pattern)

Learnings about LLM compliance with skill/agent instructions:

- Cases where the LLM ignored or reinterpreted instructions
- Missing BINDING language (MUST/MUST NOT/MANDATORY/REQUIRED)
- Pre-Flight Gate gaps that allowed invalid inputs through
- SC1-SC3 compliance issues (skill instructions treated as advisory)

**Action**: Propose instruction strengthening for affected skills with specific MUST/MUST NOT language. Reference DEF-P4-005 as the canonical example.

### Workflow Improvements

Learnings about process efficiency:

- Pipeline stage ordering improvements
- Parallel vs sequential execution discoveries
- Token budget management techniques
- Error handling and retry patterns that worked well
- Pre-flight alignment patterns that reduced post-synthesis iterations

**Action**: Propose workflow updates to affected skill SKILL.md files or pipeline templates.

### Sub-Agent Behavior Patterns

Learnings about how sub-agents behave:

- Prompt patterns that produce better/worse agent output
- Model selection insights (when Haiku/Sonnet/Opus is appropriate)
- Agent output quality patterns (verbosity, hallucination, instruction compliance)
- Context window management for sub-agents

**Action**: Propose sub-agent prompt improvements or model selection updates.

### Configuration and Convention Updates

Learnings about project configuration:

- Frontmatter field discoveries (what works, what silently breaks)
- File naming conventions that improve or degrade discoverability
- Hook configuration patterns
- Sync and portability requirements

**Action**: Propose configuration or convention updates to affected files.

### Template and Reference Improvements

Learnings about document templates:

- Output template fields that are missing or unused
- Reference document gaps (missing guidance for common scenarios)
- Diagnostic output improvements
- Cross-skill reference patterns

**Action**: Propose template or reference updates with specific field additions or removals.

### Tool and Platform Behaviors

Learnings about Claude Code platform behaviors:

- Framework observations (FW-OBS-NNN patterns)
- Tool quirks and workarounds
- Platform limitations that affect skill design
- New platform features that enable improvements

**Action**: Propose skill updates that account for discovered platform behaviors.

## Analysis Output Structure

For each improvement identified, produce:

1. **What was learned** — the specific learning item(s) driving this
2. **What it affects** — which file(s) and section(s) in the target project
3. **Proposed improvement** — specific enough for the Proposer to create a copy-paste-ready change
4. **Priority** — High (causes real failures or blocks workflows), Medium (improves quality), Low (nice to have)
5. **Evidence** — reference the source learning item IDs (L-NNN)

## Catch-All Responsibility

The general Analyzer MUST process any learning items that were not fully covered by specialized Analyzers. If an item has `skill_relevance: ["test-audit", "general"]`, the test-audit Analyzer handles the test-audit angle, but the general Analyzer should still examine it for broader implications (e.g., instruction hardening patterns that apply across all skills).

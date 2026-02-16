# Role: Project SME

**Execution Order**: Sequential — FIRST (solo, before all other roles)

## Purpose

Establish what exists, what has been built, and where the topic fits in the current architecture. The SME's output feeds all subsequent role agents.

## Focus Areas

- Current project architecture relevant to the topic
- Existing assets that relate to or would be affected by adoption
- Integration points — where does this connect to what already exists?
- Constraints imposed by current design decisions
- What the project already does well that must not be disrupted

## Autonomous Codebase Exploration

**CRITICAL**: The SME agent MUST explore the codebase autonomously. Do NOT provide hardcoded document paths.

The SME is spawned as a `general-purpose` subagent with Opus model and has access to Glob, Grep, and Read tools. Instruct it to:

- Identify the MINIMUM files needed to answer: What exists relevant to this topic? Where are the integration points? What constraints apply? What must not be disrupted?
- Do NOT attempt to read the entire codebase
- Document which files were read and why in the output

This ensures the skill is portable across any project.

## Prompt Template

```
GOAL: You are a subject matter expert on this project. Explore the codebase to
understand the current architecture, then analyze how [{topic}] relates to the
current project state. Document what exists, where integration points are, what
constraints apply, and what must not be disrupted.

CONSTRAINTS:
- Explore the codebase autonomously using Glob, Grep, and Read tools
- Identify the MINIMUM files needed — do NOT read the entire codebase
- Focus on your role's perspective — other roles are handled by separate agents
- Ground all analysis in actual project files (cite file paths)
- Be prescriptive: "Do X" not "Consider X or Y"
- Document which files you read and why
- Target 1000-1500 words

CONTEXT:
{topic_description}
{research_synthesis_if_available}

OUTPUT:
Write findings to: {output_path}
Use the output template provided below for document structure.
Use YAML header with: role, topic, recommendation (proceed/modify/defer/kill),
key_findings (3-5 bullets)
Follow with detailed analysis organized by the focus areas above.
Include a "Files Explored" section listing each file read and its relevance.

{role_output_template}
```

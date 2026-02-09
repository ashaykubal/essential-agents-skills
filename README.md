# Essential Agents & Skills

Production-grade agents and skills for AI-assisted development. These tools enforce code quality, catch test suite problems, validate assets against standards, and improve multi-agent workflows.

Each skill is a self-contained markdown file that plugs into any project's `.claude/skills/` directory. Agents go in `agents/`.

## Skills

### User-invocable (appear in the `/` menu)

| Skill | What it does | Command |
|-------|-------------|---------|
| [anthropic-validator](skills/anthropic-validator/) | Checks skills, hooks, agents, and other assets against official Anthropic standards | `/anthropic-validator [path]` |
| [code-review](skills/code-review/) | Structured review across security, type safety, linting, and coding standards using 4 parallel agents | `/code-review [path]` |
| [test-audit](skills/test-audit/) | Finds tests that mock the system under test, assert on calls instead of output, or fake external dependencies | `/test-audit [path]` |
| [session-handoff](skills/session-handoff/) | Generates a handoff document with progress, decisions, and next steps for the following session | `/session-handoff` |
| [statusline](skills/statusline/) | Multi-line terminal status bar with context gauge, model badge, git info, and preset switching | `/statusline init` |

### Internal (loaded by other skills)

| Skill | What it does | Used by |
|-------|-------------|---------|
| [bug-magnet-data](skills/bug-magnet-data/) | Edge case test data: boundary values, injection payloads, malformed inputs | test-audit |
| [test-classification](skills/test-classification/) | Categorizes test files by type (unit/integration/E2E) and mock usage | test-audit |
| [mock-detection](skills/mock-detection/) | Determines whether each mock is justified or hiding a testing gap | test-audit |
| [assertion-patterns](skills/assertion-patterns/) | Before/after patterns for rewriting mock-call assertions into real output checks | test-audit |
| [component-patterns](skills/component-patterns/) | Verification strategies per component type (HTTP server, CLI, database, etc.) | test-audit |
| [subagent-prompting](skills/subagent-prompting/) | 4-part template (Goal/Constraints/Context/Output) for sub-agent invocation | Any orchestration skill |
| [subagent-output-templating](skills/subagent-output-templating/) | YAML log format and summary constraints for sub-agent output | Any orchestration skill |

## Agents

| Agent | What it does | Used by |
|-------|-------------|---------|
| [standards-reviewer](agents/standards-reviewer.md) | Critical analysis of assets against standards, produces severity-rated findings | anthropic-validator |
| [statusline-setup](agents/statusline-setup.md) | Safely updates Claude Code settings.json with statusline configuration | statusline |

## Dependency map

```
test-audit
  ├── test-classification
  ├── mock-detection
  ├── assertion-patterns
  ├── component-patterns
  └── bug-magnet-data

anthropic-validator
  ├── subagent-prompting
  ├── subagent-output-templating
  └── standards-reviewer (agent)

code-review
  ├── subagent-prompting
  └── subagent-output-templating

statusline
  └── statusline-setup (agent)

session-handoff          (standalone)
subagent-prompting       (standalone)
subagent-output-templating (standalone)
```

## Installation

### Full collection

Copy everything into your project:

```bash
cp -r skills/ /path/to/project/.claude/skills/
cp -r agents/ /path/to/project/agents/
cp -r scripts/ /path/to/project/scripts/
```

### Individual skills

Copy only what you need. Check the dependency map above.

```bash
# Example: just code-review
cp -r skills/code-review /path/to/project/.claude/skills/
cp -r skills/subagent-prompting /path/to/project/.claude/skills/
cp -r skills/subagent-output-templating /path/to/project/.claude/skills/
```

### Git submodule

For easy updates:

```bash
git submodule add https://github.com/ashaykubal/essential-agents-skills.git .claude/skills/essential
```

## Origin

These skills and agents were built as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark), a development workflow enforcement system. They are maintained in sync with the Bulwark source.

## License

MIT

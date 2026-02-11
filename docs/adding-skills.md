# Adding Skills to Essential Agents & Skills

Instructions for adding new skills to this repo from different sources.

---

## From Bulwark (existing sync pipeline)

Skills extracted from The Bulwark use the rsync-based sync script.

### Steps

1. **Add skill to sync script** in the Bulwark repo:
   ```bash
   # Edit scripts/sync-essential-skills.sh
   # Add the skill name to the SKILLS array:
   SKILLS=(
     anthropic-validator
     code-review
     ...
     new-skill-name    # <-- add here
   )
   ```

2. **Run the sync script** from the Bulwark repo root:
   ```bash
   ./scripts/sync-essential-skills.sh /path/to/essential-agents-skills
   ```

3. **Clean Bulwark references** in the standalone copy:
   ```bash
   cd /path/to/essential-agents-skills
   grep -ri "bulwark" skills/new-skill-name/
   ```
   Replace any Bulwark-specific paths, names, or references. Keep only intentional Origin links.

4. **Write a README** for the skill:
   ```bash
   # Create skills/new-skill-name/README.md
   # Follow the pattern in any existing skill README
   ```

5. **Update the main README** (`README.md`):
   - Add to the skills table (user-invocable or internal)
   - Update the dependency map if it has dependencies
   - Update installation instructions if needed

6. **Check for agent dependencies**:
   If the skill spawns custom agents (check for `subagent_type` in SKILL.md), copy those agents too:
   ```bash
   # Add to sync script's agent section, or copy manually:
   cp /path/to/bulwark/agents/agent-name.md agents/
   ```
   Update the agents table in README.md.

7. **Fix executable bits** if the skill bundles shell scripts:
   ```bash
   git update-index --chmod=+x skills/new-skill-name/scripts/*.sh
   ```

8. **Commit and push** both repos.

### Checklist

- [ ] Skill added to sync script SKILLS array
- [ ] Sync script run successfully
- [ ] No stale Bulwark references (grep check)
- [ ] Skill is self-contained (scripts/templates bundled inside skill dir)
- [ ] No name collision with Claude Code built-in commands
- [ ] Agent dependencies copied (if any)
- [ ] Per-skill README.md written
- [ ] Main README.md updated (catalog + dependency map)
- [ ] Executable bits set on .sh files
- [ ] Committed and pushed

---

## From Other Projects (manual)

Skills from projects other than Bulwark are added manually. No sync script involvement.

### Known source projects

| Project | Status | Expected skills |
|---------|--------|----------------|
| [The Bulwark](https://github.com/ashaykubal/the-bulwark) | Active (sync pipeline) | 12 skills, 2 agents (current) |
| Clear Framework | On hiatus | TBD (skills to be identified after Bulwark plugin installed) |

### Steps

1. **Copy the skill folder** into this repo:
   ```bash
   cp -r /path/to/source-project/.claude/skills/skill-name skills/skill-name
   ```

2. **Make it self-contained**:
   - Move any external scripts into `skills/skill-name/scripts/`
   - Move any templates/config into `skills/skill-name/templates/`
   - No references to paths outside the skill directory

3. **Clean source project references**:
   ```bash
   grep -ri "source-project-name" skills/skill-name/
   ```
   Remove or replace project-specific references. Add an Origin link if appropriate.

4. **Check paths in SKILL.md**:
   - Replace absolute paths with relative paths (`.claude/skills/skill-name/...`)
   - Replace `${CLAUDE_PROJECT_DIR}/...` paths with skill-relative paths
   - Verify agent spawn prompts include exact config schemas (not vague instructions)

5. **Check frontmatter**:
   - `name:` must not collide with Claude Code built-ins or existing skills in this repo
   - `user-invocable:` set correctly (true for `/` menu, false for internal)
   - `tools:` lists only what the skill needs

6. **Copy agent dependencies** (if any):
   ```bash
   cp /path/to/source-project/.claude/agents/agent-name.md agents/
   ```

7. **Write a README** for the skill (follow existing patterns).

8. **Update the main README**:
   - Add to skills table
   - Update dependency map
   - Add the source project to the "Known source projects" table above (if new)

9. **Fix executable bits** on any bundled .sh files:
   ```bash
   git update-index --chmod=+x skills/skill-name/scripts/*.sh
   ```

10. **Commit and push**.

### Checklist

- [ ] Skill folder copied
- [ ] Self-contained (no external script/template dependencies)
- [ ] Source project references cleaned
- [ ] Paths are relative, not absolute
- [ ] No name collision with built-ins or existing skills
- [ ] Agent dependencies copied (if any)
- [ ] Per-skill README.md written
- [ ] Main README.md updated
- [ ] Executable bits set on .sh files
- [ ] Committed and pushed

---

## Multi-Source Sync (future)

When multiple projects regularly contribute skills, the manual approach becomes tedious. At that point, consider:

### Option 1: Per-project sync scripts

Create a sync script per source project:

```
scripts/
  sync-from-bulwark.sh       # existing
  sync-from-clear.sh          # new
  sync-all.sh                 # runs all sync scripts
```

Each script follows the same pattern as the Bulwark sync: named skill array, rsync with --delete, agent copy.

### Option 2: Config-driven sync

A single script reads a YAML manifest:

```yaml
# sync-config.yaml
sources:
  - name: bulwark
    path: ../the-bulwark
    skills:
      - anthropic-validator
      - code-review
      - test-audit
      # ...
    agents:
      - bulwark-standards-reviewer -> standards-reviewer
    renames:
      bulwark-statusline: ez-statusline

  - name: clear-framework
    path: ../clear-framework
    skills:
      - skill-a
      - skill-b
    agents: []
    renames: {}
```

```bash
# sync-all.sh reads sync-config.yaml and processes each source
./scripts/sync-all.sh
```

### When to adopt multi-source sync

- Two or more source projects contributing skills regularly
- Manual copy becoming error-prone (missed references, forgotten agents)
- The config-driven approach pays for itself after 3+ source projects

Until then, manual copy works fine for occasional additions.

---

## Common Gotchas

| Issue | Prevention |
|-------|-----------|
| Name collides with Claude Code built-in | Check `/` menu in a fresh Claude session before naming |
| Scripts not executable on Linux/macOS | `git update-index --chmod=+x` on WSL/NTFS |
| Agent prompt produces invalid config | Include exact JSON/YAML structure in the prompt |
| Skill references files outside its directory | Bundle scripts/templates inside skill dir |
| Stale source project references | `grep -ri "project-name"` after copy |
| Missing agent dependency | Trace `subagent_type` references in SKILL.md |

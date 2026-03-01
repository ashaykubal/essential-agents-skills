# LSP Troubleshooting Reference

Reference data for diagnosing LSP configuration failures. Load this file during Stage 7 (Diagnostics) and whenever Stage 6 verification fails.

---

## Common Issues

Work through issues in the order listed. Stop at the first issue that is detected and apply the fix before continuing.

| # | Issue | Detection Method | Fix Procedure |
|---|-------|-----------------|---------------|
| 1 | `ENABLE_LSP_TOOL` not set | Run `echo $ENABLE_LSP_TOOL`. If output is empty or not `1`, flag is missing. | Add `export ENABLE_LSP_TOOL=1` to shell profile (`~/.bashrc` or `~/.zshrc`). Also set the key in `~/.claude/settings.json`. Then exit and resume session. |
| 2 | Plugin not installed | Check `/plugin` Installed tab or run `claude plugin list` from a separate terminal. If plugin name is absent, plugin was not installed. | Tell user to install the plugin: type `/plugin`, search for the plugin name, and install it. Or from a separate terminal: `claude plugin install {plugin-name}`. |
| 3 | Plugin installed but not enabled | Check `/plugin` Installed tab. If plugin appears but status is not "enabled", plugin is installed but inactive. | Tell user to enable the plugin: type `/plugin`, find the plugin, and enable it. Or from a separate terminal: `claude plugin enable {plugin-name}`. |
| 4 | Debug log shows 0 servers loaded | Run `cat ~/.claude/debug/latest` and search for `Total LSP servers loaded`. If value is 0, servers did not initialize. | Confirm issues 1-3 are resolved. Tell user to exit Claude Code fully and resume the session. Check log again after resume — async loading race means first post-install resume sometimes fails. A second exit+resume resolves it. |
| 5 | Server binary not in PATH | Run `which {binary-name}` (e.g., `which typescript-language-server`). If not found, binary is not installed or not in PATH. | Install the binary using the command from `references/server-registry.md`. If installed but not in PATH, add the install location to PATH in shell profile. |

---

## Known Behaviors (Not Defects)

### Java JVM Warmup Delay

The `jdtls` server (Java) takes approximately 8 seconds to initialize due to JVM startup overhead. This is normal. Other servers typically initialize in 0.5-0.6 seconds.

If the debug log shows `Total LSP servers loaded: N` where N is less than expected and Java is one of the detected languages:
- Wait 10-15 seconds after session resume.
- Re-read `~/.claude/debug/latest`.
- jdtls should appear once JVM warmup completes.

Do not treat slow jdtls initialization as a failure unless it is absent after 20 seconds.

### Async Loading Race on First Post-Install Resume

After a fresh plugin install, the first session resume may show `Total LSP servers loaded: 0` even when configuration is correct. This is a known async loading race condition (community issue #10997).

Detection: Configuration looks correct (issues 1-3 resolved), but first resume still shows 0 servers.

Fix: Exit Claude Code and resume again. A second exit+resume consistently resolves this race.

### "Executable not found in $PATH" in Plugin Errors Tab

LSP plugins configure how Claude Code connects to a language server, but they don't include the server binary itself. If you see this error in the `/plugin` Errors tab, the binary needs to be installed separately (see server-registry.md for install commands).

---

## Debug Log Inspection

The debug log is the primary diagnostic source for LSP initialization.

**Log location:**
```
~/.claude/debug/latest
```

**Key lines to search for:**

| Line Pattern | Meaning |
|--------------|---------|
| `Total LSP servers loaded: N` | N servers initialized successfully. N=0 means none loaded. |
| `Initializing LSP server: {name}` | Server startup was attempted for this plugin. |
| `LSP server {name} failed: {reason}` | Server startup was attempted but failed. Reason indicates root cause. |
| `Plugin {name} enabled` | Plugin was found in enabled state at startup. |
| `ENABLE_LSP_TOOL not set` | The environment flag is missing. Fix issue #1. |
| `Executable not found in $PATH` | Language server binary is not installed. Fix issue #5. |

**Useful search commands:**
```bash
# Check total servers loaded
grep "Total LSP servers" ~/.claude/debug/latest

# Check for any LSP-related log lines
grep -i "lsp" ~/.claude/debug/latest

# Check for plugin loading
grep "Plugin" ~/.claude/debug/latest

# Check for failures
grep -i "failed\|error" ~/.claude/debug/latest
```

---

## ENABLE_LSP_TOOL Verification

`ENABLE_LSP_TOOL` is an undocumented flag required for LSP tool activation, discovered via community report (#15619). It must be set in two places:

**1. Shell profile** (persists across terminal sessions):
```bash
# In ~/.bashrc or ~/.zshrc
export ENABLE_LSP_TOOL=1
```

**2. `~/.claude/settings.json`** (read by Claude Code at startup):
```json
{
  "ENABLE_LSP_TOOL": "1"
}
```

To verify both locations are configured:
```bash
# Check shell profile
grep "ENABLE_LSP_TOOL" ~/.bashrc ~/.zshrc 2>/dev/null

# Check settings.json
grep "ENABLE_LSP_TOOL" ~/.claude/settings.json
```

Both must return a match with value `1`. If either is missing, fix and exit+resume.

---

## enabledPlugins Format

The `enabledPlugins` field in `~/.claude/settings.json` uses an object format with marketplace-qualified names:

```json
{
  "ENABLE_LSP_TOOL": "1",
  "enabledPlugins": {
    "typescript-lsp@claude-plugins-official": true,
    "pyright-lsp@claude-plugins-official": true
  }
}
```

**Common mistakes:**
- Using binary names instead of plugin names (e.g., `typescript-language-server` instead of `typescript-lsp`)
- Using an array format instead of object format
- Omitting the `@claude-plugins-official` marketplace qualifier
- Adding entries manually instead of letting `claude plugin install/enable` manage them

**Best practice:** Let the `claude plugin install` and `claude plugin enable` commands manage `enabledPlugins` entries. Manual editing should only be used for troubleshooting.

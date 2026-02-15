# Process Spawn Context

Edge case guidance for testing subprocess execution.

## Applicable Categories

| Category | Priority | Why |
|----------|----------|-----|
| strings/boundaries | T0 | Empty args, long commands |
| strings/special-chars | T0 | Quotes, spaces, escaping |
| strings/injection | T0 | Command injection CRITICAL |
| numbers/boundaries | T1 | Exit codes, timeouts |

## Not Applicable (Skip)

| Category | Why Skip |
|----------|----------|
| strings/injection (SQL, XSS) | Not relevant to process spawn |
| formats/* | Process args are strings |
| dates/* | Unless date is an argument |

## Security Priority

**Command injection is the #1 risk.** Always test:
1. Semicolon injection: `; rm -rf /`
2. Pipe injection: `| cat /etc/passwd`
3. Backtick injection: `` `whoami` ``
4. Subcommand injection: `$(whoami)`
5. Newline injection: `\nmalicious`
6. Argument injection: `--help` where unexpected

## Key Edge Cases

### Argument Handling
```bash
# Arguments with spaces
spawn("cmd", ["arg with spaces"])

# Arguments with quotes
spawn("cmd", ['say "hello"'])

# Arguments with special shell chars
spawn("cmd", ["$HOME", "`pwd`", "$(id)"])

# Empty arguments
spawn("cmd", ["", "arg2"])

# Many arguments
spawn("cmd", Array(1000).fill("arg"))
```

### Environment Variables
```javascript
// Sensitive env vars
spawn("cmd", [], { env: { PASSWORD: "secret" } })

// PATH manipulation
spawn("cmd", [], { env: { PATH: "/tmp:$PATH" } })

// Empty env
spawn("cmd", [], { env: {} })
```

### Working Directory
```javascript
// Non-existent directory
spawn("cmd", [], { cwd: "/nonexistent" })

// Relative path
spawn("cmd", [], { cwd: "../.." })

// Path with spaces
spawn("cmd", [], { cwd: "/path with spaces" })
```

### Exit Codes
```javascript
// Success
expect(exitCode).toBe(0)

// Standard failure
expect(exitCode).toBe(1)

// Signal termination
expect(exitCode).toBe(128 + signalNumber)

// Exit code boundaries
exitCode === 255  // -1 as unsigned byte
```

### Process Lifecycle
```javascript
// Timeout handling
const proc = spawn("sleep", ["3600"])
setTimeout(() => proc.kill(), 1000)

// Stdin closing
proc.stdin.end()

// stdout/stderr buffering
// What if output is very large?

// Zombie processes
// What if parent doesn't wait()?
```

### Shell vs Direct Execution
```javascript
// Direct (safer)
spawn("ls", ["-la"])

// Via shell (dangerous)
spawn("sh", ["-c", userInput])  // NEVER do this
exec(userInput)  // NEVER do this
```

## Consumer Usage

When bulwark-verify generates process spawn tests:
1. Load ALL command injection patterns (T0 priority)
2. Load strings/special-chars for escaping tests
3. Include exit code boundary tests
4. Test timeout and kill handling

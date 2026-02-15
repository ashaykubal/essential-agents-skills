# CLI Arguments Context

Edge case guidance for testing command-line argument handling.

## Applicable Categories

| Category | Priority | Why |
|----------|----------|-----|
| strings/boundaries | T0 | Empty args, long args, whitespace |
| strings/special-chars | T1 | Quotes, spaces, backslashes, equals signs |
| strings/injection | T1 | Command injection only (;, |, &&) |
| numbers/boundaries | T0 | Numeric arguments |

## Not Applicable (Skip)

| Category | Why Skip |
|----------|----------|
| strings/injection (SQL, XSS) | CLI doesn't use SQL/HTML |
| formats/email, formats/url | Unless CLI specifically processes these |
| encoding/normalization | Usually ASCII-only |
| dates/timezone | Unless date arguments expected |

## Key Edge Cases

### Empty and Whitespace
```bash
# Empty argument
./cli ""

# Whitespace-only argument
./cli "   "

# No arguments when required
./cli
```

### Quoting and Escaping
```bash
# Argument with spaces
./cli "hello world"

# Argument with quotes
./cli "say \"hello\""

# Argument with backslash
./cli "path\\to\\file"

# Argument with equals
./cli --key=value=with=equals
```

### Special Characters
```bash
# Glob characters (shouldn't expand)
./cli "*.txt"

# Dollar sign (shouldn't expand)
./cli '$HOME'

# Backticks (shouldn't execute)
./cli '`whoami`'
```

### Command Injection Attempts
```bash
# Semicolon injection
./cli "file; rm -rf /"

# Pipe injection
./cli "file | cat /etc/passwd"

# Subcommand injection
./cli "$(whoami)"
```

### Length Extremes
```bash
# Very long argument
./cli "$(python -c 'print("a" * 10000)')"

# Many arguments
./cli arg1 arg2 arg3 ... arg1000
```

## Consumer Usage

When test-audit or bulwark-verify processes CLI-related code:
1. Load strings/boundaries
2. Load strings/special-chars
3. Load command injection patterns from strings/injection
4. Skip SQL/XSS patterns

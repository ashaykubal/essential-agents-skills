# File Contents Context

Edge case guidance for testing file I/O and parsing.

## Applicable Categories

| Category | Priority | Why |
|----------|----------|-----|
| strings/boundaries | T0 | Empty files, large files |
| encoding/charset | T1 | BOM, encoding detection |
| encoding/normalization | T2 | Unicode in file contents |
| strings/special-chars | T1 | Control characters, line endings |
| formats/json | T0 | If parsing JSON files |

## Not Applicable (Skip)

| Category | Why Skip |
|----------|----------|
| strings/injection | Files aren't executed (usually) |
| formats/email, formats/url | Unless file contains these |
| concurrency/* | Test at file system level separately |

## Key Edge Cases

### Empty and Size
```
# Empty file (0 bytes)
# Single byte file
# Very large file (>2GB for 32-bit limits)
# File size exactly at buffer boundary
```

### Line Endings
```
# Unix (LF only)
line1\nline2\n

# Windows (CRLF)
line1\r\nline2\r\n

# Classic Mac (CR only)
line1\rline2\r

# Mixed
line1\nline2\r\nline3\r

# No trailing newline
line1\nline2

# Only newlines
\n\n\n
```

### Encoding
```
# UTF-8 with BOM
\xEF\xBB\xBF...content...

# UTF-16 LE with BOM
\xFF\xFE...content...

# Latin-1 (looks like broken UTF-8)
caf\xe9

# Invalid UTF-8 sequences
\x80\x81\x82
```

### Special Characters
```
# Null bytes in middle
hello\x00world

# Control characters
line\x07\x08\x1B

# Tabs mixed with spaces
\t  \t  content
```

### File Names (for path handling)
```
# Spaces in name
my file.txt

# Unicode in name
café.txt

# Very long name
aaaa...200 chars...aaaa.txt

# Special characters
file;name.txt
../traversal.txt
```

## Consumer Usage

When bulwark-verify generates file I/O tests:
1. Load strings/boundaries for size edge cases
2. Load encoding/charset for BOM and encoding tests
3. Load strings/special-chars for control characters
4. Consider file format (JSON, XML, etc.) for format-specific tests

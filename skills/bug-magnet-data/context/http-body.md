# HTTP Body Context

Edge case guidance for testing HTTP request/response body handling.

## Applicable Categories

| Category | Priority | Why |
|----------|----------|-----|
| strings/boundaries | T0 | Empty body, large payloads |
| strings/unicode | T1 | Multi-byte characters, emoji |
| strings/injection | T1 | All patterns (depends on content type) |
| formats/json | T0 | JSON body parsing |
| formats/email | T2 | If form contains email fields |
| formats/url | T2 | If body contains URLs |
| encoding/charset | T1 | Content-Type charset handling |
| numbers/boundaries | T0 | Numeric fields |

## Not Applicable (Skip)

| Category | Why Skip |
|----------|----------|
| concurrency/state-machines | Test separately at higher level |
| language-specific/* | HTTP is language-agnostic |

## Key Edge Cases by Content-Type

### application/json
```json
// Empty object
{}

// Empty array
[]

// Deep nesting
{"a":{"b":{"c":{"d":{"e":1}}}}}

// Large numbers
{"n": 99999999999999999999}

// Unicode
{"name": "José 😀"}

// Prototype pollution
{"__proto__": {"polluted": true}}
```

### application/x-www-form-urlencoded
```
# Empty value
field=

# Multiple values
field=a&field=b

# Special characters
field=hello+world&other=a%26b

# Unicode
name=%C3%A9  (é encoded)
```

### multipart/form-data
- Empty file upload
- Very large file
- File with special filename
- File with wrong content-type
- Binary file with null bytes

### text/plain
- Empty body
- Very large body
- Binary characters
- Mixed line endings (CRLF, LF)

## Injection Context

| Content-Type | Applicable Injection Patterns |
|--------------|------------------------------|
| application/json | All (depending on backend use) |
| text/html | XSS patterns critical |
| text/plain | Depends on processing |
| application/xml | XXE patterns |

## Consumer Usage

When bulwark-verify generates HTTP body tests:
1. Identify Content-Type
2. Load formats/ category for that type
3. Load strings/boundaries
4. Load relevant injection patterns based on how data is used

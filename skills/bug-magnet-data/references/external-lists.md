# External Edge Case Lists

Reference URLs to maintained external sources. These are not embedded to avoid staleness.

---

## Big List of Naughty Strings (BLNS)

**URL**: https://github.com/minimaxir/big-list-of-naughty-strings

**Description**: A comprehensive list of strings that have a high probability of causing issues when used as user input. Created by Max Woolf, this is one of the most widely-used edge case string collections.

**Categories covered**:
- Reserved strings
- Numeric strings
- Special characters
- Unicode edge cases
- Emoji
- Regional indicators
- Script injection
- SQL injection
- XSS patterns
- Server code injection

**Format**: Text file with one string per line

**License**: MIT

**Last verified**: 2026-02-01

---

## OWASP Fuzz Vectors

**URL**: https://owasp.org/www-project-web-security-testing-guide/v42/6-Appendix/C-Fuzz_Vectors

**Description**: OWASP-maintained collection of fuzz testing vectors organized by vulnerability category. Part of the Web Security Testing Guide.

**Categories covered**:
- SQL Injection
- LDAP Injection
- XPath Injection
- XML Injection
- Command Injection
- Cross-Site Scripting (XSS)
- Format String Attacks
- Buffer Overflow patterns
- Integer Overflow patterns

**Format**: Web page with categorized examples

**License**: CC BY-SA 4.0

**Last verified**: 2026-02-01

---

## SecLists

**URL**: https://github.com/danielmiessler/SecLists

**Description**: A collection of multiple types of lists used during security assessments. While primarily for penetration testing, contains valuable edge case data.

**Relevant directories**:
- `Fuzzing/` - General fuzzing payloads
- `Payloads/` - Injection payloads
- `Pattern-Matching/` - Detection patterns

**Note**: This is a large repository. Reference specific files rather than the entire repo.

**License**: MIT

**Last verified**: 2026-02-01

---

## Unicode Confusables

**URL**: https://www.unicode.org/Public/security/latest/confusables.txt

**Description**: Official Unicode Consortium list of visually confusable characters. Essential for homoglyph attack testing.

**Use cases**:
- Username spoofing detection
- Domain squatting detection
- Visual similarity checks

**Format**: Text file with mappings

**License**: Unicode License

**Last verified**: 2026-02-01

---

## Usage Guidelines

1. **Don't embed copies**: These lists are maintained externally. Reference the URLs.

2. **Check for updates**: External lists are updated periodically. The `last verified` date indicates when we confirmed the URL was valid.

3. **Curate subsets**: The bug-magnet-data YAML files contain curated subsets of these lists, not full copies.

4. **Attribution**: When using patterns from these sources, the data files include `source_urls` in metadata.

---

## Suggesting New Sources

If you discover a valuable edge case source:

1. Verify it's actively maintained
2. Check licensing allows reference/citation
3. Identify which categories it covers
4. Add to this file with URL, description, and verification date

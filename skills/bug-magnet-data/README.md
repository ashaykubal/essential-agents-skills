# Bug Magnet Data

A collection of edge case test data organized by data type — strings, numbers, dates, encoding, formats, collections, concurrency, and language-specific quirks. Provides ready-to-use boundary values, injection payloads, and malformed inputs so you don't have to invent them from scratch every time you write tests.

## Quick Start

This is an internal skill — it's loaded automatically by other skills like `test-audit`. You don't invoke it directly.

To use the data in your own skills, add `bug-magnet-data` to your skill's `skills` frontmatter array.

## What It Does

- Supplies edge case values across 10+ data categories (strings, numbers, dates, encoding, etc.)
- Includes context-specific loading guidance for different input surfaces (CLI args, HTTP bodies, DB queries, file contents, process spawning)
- Each data file uses YAML with structured categories, descriptions, and expected behavior notes
- References external sources (BLNS, OWASP) for keeping data current

## Dependencies

None — fully standalone.

## Installation

```bash
cp -r skills/bug-magnet-data /path/to/project/.claude/skills/
```

## Origin

Developed as part of [The Bulwark](https://github.com/ashaykubal/the-bulwark) quality enforcement framework.

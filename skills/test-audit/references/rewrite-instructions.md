# Rewrite Instructions

When `REWRITE_REQUIRED == true`, follow this procedure for each file in `files_to_rewrite` (ordered by priority, then effectiveness):

```
FOR each file in files_to_rewrite:
    1. Read the file
    2. Load `assertion-patterns` skill (P2.1) for T1-T4 transformation patterns
    3. Identify component type from code analysis
    4. Load `component-patterns` skill (P2.2) for verification templates
    5. Load `bug-magnet-data` context file matching component type:
       - CLI: context/cli-args.md
       - HTTP Server: context/http-body.md
       - File Parser: context/file-contents.md
       - Database: context/db-query.md
       - Process Spawner: context/process-spawn.md
    6. Load T0 + T1 edge cases from bug-magnet-data/data/ for the component:
       - T0 (Always): strings/boundaries, numbers/boundaries, booleans/boundaries
       - T1 (Common): strings/injection (if input handling), strings/unicode
    7. Select applicable patterns for the violation type:
       - T1 fix: Apply "Function call" or "Process spawn" patterns from P2.1
       - T2 fix: Apply "Add result assertion" pattern from P2.1
       - T3 fix: Apply "HTTP Server" or appropriate boundary pattern from P2.2
       - T3+ fix: Apply chain patterns from P2.1
    8. Generate verification script as intermediate artifact:
       - Location: tmp/verification/{test-name}-verify.{ext}
       - Purpose: Validate rewrite works before modifying test
       - REQUIRED: Include edge cases from bug-magnet-data in verification
    9. Rewrite test file using structured patterns
   10. Run verification script to confirm fix
   11. Run original test to verify it now passes
```

If `REWRITE_REQUIRED == false`: Display recommendations without auto-rewrite.

## Bug-Magnet-Data Integration (REQUIRED)

When generating verification scripts (step 8), you MUST include edge cases from bug-magnet-data:

1. **Read the context file** for the detected component type (step 5)
2. **Load applicable data files** based on context file's "Applicable Categories" section
3. **Include at minimum**:
   - Empty string / zero / null boundary values (T0)
   - Length extremes for any string inputs (T0)
   - Injection patterns if component handles external input (T1)
4. **Mark destructive patterns** (`safe_for_automation: false`) as manual-only in script comments

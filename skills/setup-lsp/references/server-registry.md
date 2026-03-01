# LSP Server Registry

Reference data for tech stack detection, binary installation, and plugin identification. Load this file during Stage 2 (detection) and Stage 3 (installation).

---

## Official LSP Plugins (claude-plugins-official marketplace)

These are the official LSP plugins available from the `claude-plugins-official` marketplace. Plugin names are used for `claude plugin install` and `/plugin` search.

| Language | Manifest Files | Plugin Name | Binary Install Command |
|----------|---------------|-------------|----------------------|
| TypeScript / JavaScript | `package.json`, `tsconfig.json` | `typescript-lsp` | `npm install -g typescript-language-server typescript` |
| Python | `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements.txt` | `pyright-lsp` | `pip install pyright` or `npm install -g pyright` |
| Rust | `Cargo.toml` | `rust-analyzer-lsp` | `rustup component add rust-analyzer` |
| Go | `go.mod` | `gopls-lsp` | `go install golang.org/x/tools/gopls@latest` |
| Java | `pom.xml`, `build.gradle`, `build.gradle.kts` | `jdtls-lsp` | `brew install jdtls` (macOS) / `apt-get install jdtls` (Debian) |
| C# | `*.csproj`, `*.sln` | `csharp-lsp` | `dotnet tool install -g csharp-ls` |
| PHP | `composer.json` | `php-lsp` | `npm install -g intelephense` |
| C / C++ | `CMakeLists.txt`, `Makefile`, `*.c`, `*.cpp` | `clangd-lsp` | `brew install llvm` (macOS) / `apt-get install clangd` (Debian) |
| Kotlin | `build.gradle.kts`, `*.kt` | `kotlin-lsp` | See https://github.com/fwcd/kotlin-language-server/releases |
| Swift | `Package.swift`, `*.swift` | `swift-lsp` | Bundled with Xcode / Swift toolchain |
| Lua | `*.lua`, `.luarc.json` | `lua-lsp` | `brew install lua-language-server` (macOS) / see GitHub releases |

**Note**: Ruby (`ruby-lsp`) does not have an official marketplace plugin as of February 2026.

---

## Monorepo Scanning Guidance

When scanning a monorepo (a repository with multiple packages or services in subdirectories):

1. Scan project root first for any manifest files.
2. Scan each immediate subdirectory (depth 1) for manifest files.
3. Scan one level deeper (depth 2) if subdirectories contain further subdirectories with recognizable names (e.g., `packages/`, `services/`, `apps/`, `modules/`).
4. Do not scan deeper than 2 levels — returns diminishing signal.

For each unique combination of (language, plugin name) found across all scanned directories:
- Report the language once, listing all manifest paths found.
- Install the server binary once (not once per manifest).

Example output for a monorepo:
```
Detected languages:
  - TypeScript (packages/web/package.json, packages/api/package.json) → plugin: typescript-lsp
  - Python (services/ml/requirements.txt) → plugin: pyright-lsp
```

---

## LSP Capabilities Reference

### Passive Capabilities (automatic, no invocation needed)

| Capability | Description |
|------------|-------------|
| Real-time error detection | Syntax and type errors highlighted as you edit |
| Diagnostic pushing | Server pushes warnings and errors to the client |
| Self-correcting edits | Some servers provide on-save auto-fix for lint violations |

### Active Capabilities (Claude invokes these explicitly)

| Capability | Description |
|------------|-------------|
| Go-to-definition | Jump from a symbol reference to its declaration |
| Find references | List all locations where a symbol is used |
| Hover type info | Show inferred or declared type for any expression |
| Symbol search | Search the workspace for a symbol by name |
| Implementation tracing | Find concrete implementations of an interface/abstract method |
| Call hierarchy | Show callers and callees for a function |
| Rename symbol | Refactor a symbol name across all references |

Active capabilities replace grep/glob searches with semantically accurate results that respect scope, types, and inheritance.

---

## Plugin Installation Notes

**IMPORTANT**: Claude cannot run `claude plugin install/enable` commands from within a session. These are CLI operations the user must perform outside the session or via the `/plugin` TUI command within a session.

The correct installation flow is:
1. Install language server binary (Claude CAN do this via npm/pip/go install etc.)
2. User installs the plugin via `/plugin` search or `claude plugin install <name>` from a terminal
3. Set `ENABLE_LSP_TOOL=1` in settings and shell profile
4. Exit and resume session for LSP servers to initialize

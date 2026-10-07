# Changelog

All notable changes to Muraqib will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-07

### Added
- **Environment Guard** — Type-safe environment variable loading with Zod/Valibot/ArkType
  - Advanced `.env` file loader with variable expansion and multiline value support
  - `createEnv()`, `safeCreateEnv()`, and `loadEnv()` functions
  - Support for server and client-side variable prefixes
  - Schedule guard for cron-based execution windows

- **Performance Auditor** — 13-module comprehensive audit pipeline
  1. Static Assets — Image size validation (> 500 KB detection)
  2. Bundle Size — 14 KB round-trip budget enforcement
  3. Network Latency — Request timing and payload size measurement
  4. Memory Usage — Heap leak and RSS threshold detection
  5. Security Headers — Missing security header detection and scoring
  6. Dead Code — Empty functions, unreachable branches, unused exports
  7. Dependencies — Circular dependencies, deprecated APIs, duplicate packages
  8. Async Patterns — Floating promises, missing await detection
  9. Configuration — Missing files and insecure config detection
  10. Environment Variables — Database URL, PORT, cache rules validation
  11. Performance Cache — Cache strategy optimization
  12. HTTP Optimizer — Cookie size and HTTP/2 vs HTTP/1.x detection
  13. Render Blocking — Blocking scripts and stylesheets detection

- **Package Upgrade Orchestrator** — Automated dependency management
  - Smart version bumping strategies (replace, widen, bump)
  - Automated schema migrations for major versions:
    - Tailwind CSS v4
    - Prisma v6
    - Next.js v15
    - React v19
    - ESLint v9
    - Zustand v5
  - Build integrity verification
  - Auto-rollback on build failure

- **CLI Interface** — Command-line tool for running audits
  - `--url` flag for performance audits
  - `--security-url` flag for security audits
  - `--silent` flag for quiet output
  - JSON and formatted output options

- **Preset System** — Pre-built validation schemas
  - Zod preset support
  - Valibot preset support
  - ArkType preset support
  - Local and remote preset loading

- **Project Configuration**
  - ESLint configuration with TypeScript support
  - Prettier code formatting standards
  - EditorConfig for consistent indentation
  - Git attributes for LF line endings
  - CI/CD workflows for GitHub Actions
  - Comprehensive test suite with Vitest

- **Documentation**
  - README with feature list and API reference
  - CLAUDE.md with development guidelines
  - CONTRIBUTING.md with contribution workflow
  - SECURITY.md with vulnerability reporting
  - GitHub issue templates
  - TypeScript strict mode with full type safety

### Technical Highlights
- TypeScript 6.0+ with strict mode enabled
- ESM modules with `verbatimModuleSyntax: true`
- 73 test cases with full coverage of core functionality
- Zero external security vulnerabilities
- Multi-version Node.js support (18.x, 20.x, 22.x)

---

For detailed information about each feature, see [README.md](README.md).

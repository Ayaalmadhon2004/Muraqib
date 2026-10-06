# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Muraqib** (مراقب) is a comprehensive developer environment guardian and performance auditor for Node.js/TypeScript projects. It provides:

1. **Environment Validation** — Type-safe environment variable loading with Zod/Valibot/ArkType
2. **Performance Auditing** — 13-module audit pipeline (cache, bundle size, security headers, memory, dead code, dependencies, async patterns, etc.)
3. **Package Upgrade Orchestrator** — Automated package upgrades with schema migrations and build verification

## Development Commands

### Build and Compilation
```bash
npm run build              # Compile TypeScript to JavaScript (tsc)
npm run dev               # Watch mode with tsx (auto-rebuild on file changes)
```

### Testing
```bash
npm test                  # Run all tests with Vitest
npm test -- --coverage   # Run tests with coverage report
```

### Linting and Code Quality
```bash
npm run lint             # Run ESLint on TypeScript files
npm run lint -- --fix    # Auto-fix linting issues where possible
```

### Running the Auditor
```bash
npm run audit            # Run full audit on http://localhost:3000
npm run audit:ci         # Collect audit data (uses scripts/collect-audit.ts)
```

### Development Server (Optional)
```bash
npm run dev-server       # Start demo Express/Prisma server (examples/express-prisma)
```

## Code Architecture

### Directory Structure
```
src/
├── index.ts                      # Main CLI entry, exports public API
├── env.ts                        # Environment engine (createEnv, loadEnv, safeCreateEnv)
├── core/
│   ├── types.ts                  # Shared TypeScript interfaces and types
│   ├── standard.ts               # Guard schema definitions
│   ├── memory-guard.ts           # Memory/heap leak auditing
│   ├── security-guard.ts         # Security headers audit
│   ├── dependency-guard.ts       # Circular deps, deprecated APIs, duplicates
│   ├── async-guard.ts            # Floating promises, missing await
│   ├── config-guard.ts           # Configuration file validation
│   ├── orchestrator.ts           # Package upgrade engine with schema migrations
│   ├── muraqib-env.ts            # Internal environment setup
│   └── performance/
│       ├── auditor.ts            # Cache performance audit
│       ├── image-guard.ts        # Image size audit
│       ├── network-latency-advisor.ts
│       ├── optimizer-engine.ts   # HTTP/2, cookies, resource analysis
│       ├── render-blocking.ts    # Render blocking detector
│       ├── http-probe.ts         # Protocol and cookie measurement
│       └── html-scanner.ts       # HTML parsing utilities
├── rules/
│   ├── cache-guard.ts            # Cache strategy validation
│   ├── bundle-budget.ts          # Bundle size budget (14 KB)
│   ├── dead-code-guard.ts        # Dead code detection
│   └── http1-advisor.ts          # HTTP/1.x protocol hints
├── presets/
│   ├── zod.ts                    # Zod schema validation preset
│   ├── valibot.ts                # Valibot validation preset
│   └── arktype.ts                # ArkType validation preset
├── config/
│   └── presets.ts                # Local and remote preset definitions
└── utils/
    ├── schedule-validator.ts     # Cron schedule parsing
    └── manager-detector.ts       # Package manager (npm/yarn/pnpm) detection
```

### Core Concepts

1. **Audit Modules** — Each audit module (memory, security, dependencies, etc.) is independent and returns a structured result with issues and messages.

2. **Environment Engine** — The `env.ts` file is the core of environment validation:
   - `createEnv()` — throws on validation error
   - `safeCreateEnv()` — returns `{ success, data } | { success, error }`
   - `loadEnv()` — parses .env files with variable expansion
   - `createEnvWithPresets()` — wraps createEnv with pre-built validation schemas

3. **Presets System** — Validation schemas for popular frameworks (Next.js, Prisma, Tailwind, etc.) that can be injected at runtime.

4. **Performance Auditors** — Use various analysis techniques:
   - AST parsing for dead code detection
   - File system scanning for image/bundle sizes
   - Live HTTP probing for protocol detection
   - HTML parsing for render-blocking detection

5. **Schema Migrations** — The orchestrator supports auto-migrations for breaking changes in:
   - Tailwind CSS v4, Prisma v6, Next.js v15, React v19, ESLint v9, Zustand v5

## Key Implementation Patterns

### Error Handling
- Audit functions return objects with `status` ('ok', 'issues', 'warning') and detailed `issues[]` arrays
- Don't throw from audit functions; errors are collected and reported
- `createEnv()` throws on validation failure; `safeCreateEnv()` returns results

### Testing
- Tests use Vitest with global test setup
- Test files are excluded from tsconfig compilation via `exclude` array
- Test fixtures are in `tests/fixtures.ts`
- Coverage reports are HTML, JSON, and text formats

### TypeScript Configuration
- Strict type checking enabled: `strict: true`, `noImplicitAny: true`
- No unused variables/parameters allowed (except underscore-prefixed)
- ESM modules with `verbatimModuleSyntax: true`
- Source maps and declaration maps generated for debugging

### ESLint Rules
- No explicit `any` (warn level only)
- Unused vars with `^_` exception for intentional ignore patterns
- All files in `src/` must pass ESLint before commit

## Common Workflows

### Adding a New Audit Module
1. Create `src/core/new-guard.ts` with a `performNewAudit()` function
2. Return object with: `{ status: 'ok' | 'issues', issues: [], message: string }`
3. Export from `src/index.ts`
4. Add call in main audit pipeline in `src/index.ts`
5. Write tests in `src/core/new-guard.spec.ts`
6. Update README audit table

### Adding a Validation Preset
1. Create `src/presets/my-preset.ts` exporting a Zod/Valibot/ArkType schema
2. Add preset definition to `src/config/presets.ts`
3. Schema should use shape: `{ VAR_NAME: z.string(), ... }`

### Running a Single Test
```bash
npm test -- --reporter=verbose tests/validate.spec.ts
```

### Debugging TypeScript Issues
- Run `npm run build` to get full type errors
- Check `tsconfig.json` for strict settings
- Use `noUncheckedIndexedAccess` to catch unsafe bracket access

## Important Notes

1. **Async Patterns** — Code mixes Promise-based and callback-based async. Audit functions are async but return structured results, not throwing.

2. **Multiple Validation Backends** — Zod, Valibot, and ArkType are all supported. Presets allow users to choose their validator.

3. **Live Probing** — Network audits require a live endpoint. Use `--url` and `--security-url` flags for performance/security audits.

4. **CLI vs API** — The same code runs both as CLI (`npm run audit`) and as importable API. Both paths go through `src/index.ts`.

5. **Demo Server** — `examples/express-prisma/` is optional and kept separate (npm install needed). It demonstrates environment validation + Prisma usage.

6. **Arabic Output** — Several audit messages use Arabic text. Keep this localization intact for regional users.

## References

- [README.md](README.md) — Full feature list, API reference, schema migrations table
- [AUDIT.md](AUDIT.md) — Audit module details and recommendations
- [tsconfig.json](tsconfig.json) — TypeScript strict settings
- [vitest.config.ts](vitest.config.ts) — Test configuration and coverage

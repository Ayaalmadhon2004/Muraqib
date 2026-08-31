<div align="center">

# 🔍 Muraqib <span dir="rtl">مراقب</span>

**Developer Environment Guardian & Performance Auditor**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Zod](https://img.shields.io/badge/Zod-3.x-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<p dir="rtl">
<strong>مراقب</strong> هو أداة تدقيق شاملة لبيئات التطوير — تفحص، ترصد، وتحسّن أداء مشاريعك بذكاء.
</p>

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Modules](#-core-modules)
- [Environment Validation](#-environment-validation)
- [CLI Usage](#-cli-usage)
- [API Reference](#-api-reference)
- [Architecture](#-architecture)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔐 Environment Guard
- **Advanced `.env` Loader** — supports inline comments, multiline values, variable expansion (`$VAR`, `${VAR:-default}`), and quote handling
- **Runtime Validation** — type-safe environment validation powered by [Zod](https://zod.dev/)
- **Safe Mode** — `safeCreateEnv()` returns results instead of throwing
- **Schedule Guard** — halt execution outside allowed cron windows
- **Preset System** — inject pre-built validation schemas (local or remote)

### 🚀 Performance Auditor (13 Modules)
| # | Module | What it checks |
|---|--------|---------------|
| 1 | **Static Assets** | Image sizes > 500 KB |
| 2 | **Bundle Size** | 14 KB round-trip budget |
| 3 | **Network Latency** | Request time & payload size |
| 4 | **Memory Usage** | Heap leaks & RSS thresholds |
| 5 | **Security Headers** | Missing security headers & score |
| 6 | **Dead Code** | Empty functions, unreachable branches, unused exports |
| 7 | **Dependencies** | Circular deps, deprecated APIs, duplicate packages |
| 8 | **Async Patterns** | Floating promises, missing `await`, unhandled rejections |
| 9 | **Configuration** | Missing files, insecure configs, invalid settings |
| 10 | **Environment Vars** | `DATABASE_URL`, `PORT`, cache rules |
| 11 | **Performance Cache** | Cache strategy optimization |
| 12 | **HTTP Optimizer** | Cookie size, HTTP/2 vs HTTP/1.x protocol hints |
| 13 | **Render Blocking** | Blocking scripts & stylesheets in `<head>` |

### 🔄 Package Upgrade Orchestrator
- **Smart Version Bumping** — `replace`, `widen`, or `bump` strategies
- **Schema Migrations** — automated codemods for Tailwind, Prisma, Next.js, React, ESLint, Zustand
- **Build Integrity Check** — validates the project still builds after upgrade
- **Auto-Rollback** — reverts via Git if the build breaks

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Ayaalmadhon2004/Muraqib.git
cd Muraqib

# Install dependencies
npm install

# Build the project
npm run build
```

---

## 🚀 Quick Start

### 1. Environment Validation

```typescript
import { createEnv, z } from "muraqib";

const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    PORT: z.string().regex(/^\d+$/).transform(Number),
  },
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
```

### 2. Run a Full Audit

```bash
# Run everything
npx tsx src/index.ts

# Skip heavy checks
npx tsx src/index.ts --skip-memory --skip-security

# Safe mode (no throws)
npx tsx src/index.ts --safe

# With schedule guard
npx tsx src/index.ts --schedule "0 9 * * 1-5"

# Upgrade packages with rollback
npx tsx src/index.ts --upgrade
```

### 3. Safe Environment (returns result, never throws)

```typescript
import { safeCreateEnv } from "muraqib";

const result = safeCreateEnv({
  server: { API_KEY: z.string().min(1) },
  runtimeEnv: process.env,
});

if (!result.success) {
  console.error(result.error);
  // [{ path: "API_KEY", message: "Required" }]
}
```

---

## 🧩 Core Modules

### Environment Loader

```typescript
import { loadEnv } from "muraqib";

loadEnv({
  files: [".env", ".env.local", ".env.production"],
  verbose: true,           // Log every loaded key
  preserveProcessEnv: false, // Merge into process.env
});
```

**Supported syntax:**
```bash
# Inline comments
DATABASE_URL=postgres://localhost/db # local dev

# Multiline
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMII..."

# Variable expansion
BASE_URL=https://api.example.com
API_URL=$BASE_URL/v1
FALLBACK=${MISSING:-default_value}
```

### Presets

```typescript
import { createEnvWithPresets } from "muraqib";

const env = createEnvWithPresets(
  { MY_VAR: z.string() },
  {
    runtimeEnv: process.env,
    presets: ["nextjs", "prisma", "tailwind"],
  }
);

&lt;div align="center"&gt;

# 🔍 Muraqib &lt;span dir="rtl"&gt;مراقب&lt;/span&gt;

**Developer Environment Guardian & Performance Auditor**
[](https://www.typescriptlang.org/)[](https://nodejs.org/)[](https://zod.dev/)[](LICENSE)&lt;p dir="rtl"&gt;
&lt;strong&gt;مراقب&lt;/strong&gt; هو أداة تدقيق شاملة لبيئات التطوير — تفحص، ترصد، وتحسّن أداء مشاريعك بذكاء.
&lt;/p&gt;

&lt;/div&gt;

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Modules](#-core-modules)
- [Environment Validation](#-environment-validation)
- [CLI Usage](#-cli-usage)
- [API Reference](#-api-reference)
- [Architecture](#-architecture)
- [Development Scripts](#-development-scripts)
- [Contributing](#-contributing)

---

## ✨ Features

### 🔐 Environment Guard
- **Advanced `.env` Loader** — supports inline comments, multiline values, variable expansion (`$VAR`, `${VAR:-default}`), and quote handling
- **Runtime Validation** — type-safe environment validation powered by [Zod](https://zod.dev/)
- **Safe Mode** — `safeCreateEnv()` returns results instead of throwing
- **Schedule Guard** — halt execution outside allowed cron windows
- **Preset System** — inject pre-built validation schemas (local or remote)

### 🚀 Performance Auditor (13 Modules)
| # | Module | What it checks |
|---|--------|---------------|
| 1 | **Static Assets** | Image sizes &gt; 500 KB |
| 2 | **Bundle Size** | 14 KB round-trip budget |
| 3 | **Network Latency** | Request time & payload size |
| 4 | **Memory Usage** | Heap leaks & RSS thresholds |
| 5 | **Security Headers** | Missing security headers & score |
| 6 | **Dead Code** | Empty functions, unreachable branches, unused exports |
| 7 | **Dependencies** | Circular deps, deprecated APIs, duplicate packages |
| 8 | **Async Patterns** | Floating promises, missing `await`, unhandled rejections |
| 9 | **Configuration** | Missing files, insecure configs, invalid settings |
| 10 | **Environment Vars** | `DATABASE_URL`, `PORT`, cache rules |
| 11 | **Performance Cache** | Cache strategy optimization |
| 12 | **HTTP Optimizer** | Cookie size, HTTP/2 vs HTTP/1.x protocol hints |
| 13 | **Render Blocking** | Blocking scripts & stylesheets in `&lt;head&gt;` |

### 🔄 Package Upgrade Orchestrator
- **Smart Version Bumping** — `replace`, `widen`, or `bump` strategies
- **Schema Migrations** — automated codemods for Tailwind, Prisma, Next.js, React, ESLint, Zustand
- **Build Integrity Check** — validates the project still builds after upgrade
- **Auto-Rollback** — reverts via Git if the build breaks

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Ayaalmadhon2004/Muraqib.git
cd Muraqib

# Install dependencies
npm install

# Build the project
npm run build

## 💻 CLI Usage

```
Usage: npx tsx src/index.ts [options]

Options:
  --path <dir>              Target project directory (default: cwd)
  --url <url>               Latency test endpoint
  --security-url <url>      Security audit endpoint
  --skip-env                Skip environment validation
  --skip-memory             Skip memory audit
  --skip-security           Skip security headers audit
  --skip-dead-code          Skip dead code detection
  --skip-dependencies       Skip dependency analysis
  --skip-async              Skip async patterns audit
  --skip-config             Skip configuration validation
  --skip-performance        Skip performance cache audit
  --skip-optimizer          Skip HTTP optimizer audit
  --skip-render-blocking    Skip render blocking audit
  --silent                  Suppress all output
  --safe                    Use safeCreateEnv (no throws)
  --schedule <cron>         Cron schedule gate (e.g. "0 9 * * 1-5")
  --presets <list>          Comma-separated preset names
  --upgrade                 Run package upgrade orchestrator
```

---

## 📖 API Reference

### `createEnv(options)`
Builds and validates runtime environment. Throws on failure.

### `safeCreateEnv(options)`
Same as `createEnv` but returns `{ success, data } | { success, error }`.

### `loadEnv(options)`
Advanced `.env` file parser with expansion and multiline support.

### `createEnvWithPresets(schema, options)`
Wraps `createEnv` with pre-built validation presets.

### `runAudit(options)`
Runs the full 13-module audit pipeline asynchronously.

### `runMuraqibUpgradeOrchestrator(config)`
Upgrades a single package with schema migration and build verification.

---

## 🏗 Architecture

```
Muraqib/
├── src/
│   ├── index.ts                    # CLI entry + audit runner
│   ├── env.ts                      # Environment engine (createEnv, loadEnv, ...)
│   ├── core/
│   │   ├── types.ts                # Shared TypeScript types
│   │   ├── standard.ts             # Guard schema standard
│   │   ├── performance/
│   │   │   ├── auditor.ts          # Cache performance audit
│   │   │   ├── image-guard.ts      # Image size audit
│   │   │   ├── network-latency-advisor.ts
│   │   │   ├── optimizer-engine.ts # HTTP/cookie analyzer
│   │   │   └── render-blocking.ts  # Render blocking detector
│   │   ├── memory-guard.ts
│   │   ├── security-guard.ts
│   │   ├── dependency-guard.ts
│   │   ├── async-guard.ts
│   │   ├── config-guard.ts
│   │   └── orchestrator.ts         # Package upgrade engine
│   ├── rules/
│   │   ├── cache-guard.ts
│   │   ├── bundle-budget.ts
│   │   └── dead-code-guard.ts
│   ├── config/
│   │   └── presets.ts              # Local & remote preset definitions
│   └── utils/
│       ├── schedule-validator.ts
│       └── manager-detector.ts     # Package manager detection
└── README.md
```

---

## 🛡️ Schema Migrations Supported

| Package | Breaking Version | Auto-Migration |
|---------|-----------------|----------------|
| Tailwind CSS | v4 | `npx @tailwindcss/upgrade@latest` |
| Prisma | v6 | `npx prisma format && validate` |
| Next.js | v15 | `npx @next/codemod@latest` |
| React | v19 | `npx react-codemod@latest` |
| ESLint | v9 | `npx @eslint/config-inspector@latest` |
| Zustand | v5 | `npx zustand-codemod v5-migration` |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">

Made with 💙 by **Aya Almadhon**

<p dir="rtl">
<strong>مراقب</strong> — لأن جودة الكود تبدأ من البيئة.
</p>

</div>

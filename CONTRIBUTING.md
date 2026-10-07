# Contributing to Muraqib

Thank you for your interest in contributing to **Muraqib** (مراقب), the Developer Environment Guardian & Performance Auditor!

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup
```bash
# Clone the repository
git clone https://github.com/Ayaalmadhon2004/Muraqib.git
cd Muraqib

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Development Workflow

### Available Commands
```bash
npm run build          # Compile TypeScript to JavaScript (tsc)
npm run dev           # Watch mode with tsx (auto-rebuild on file changes)
npm test              # Run all tests with Vitest
npm run lint          # Run ESLint on TypeScript files
npm run lint -- --fix # Auto-fix linting issues
npm run audit         # Run full audit on http://localhost:3000
npm run dev-server    # Start demo Express/Prisma server
```

## Code Standards

### TypeScript
- Strict mode is enabled: `strict: true`, `noImplicitAny: true`
- No unused variables/parameters (except underscore-prefixed for intentional ignore)
- Type-safe exports: use explicit types instead of `any`
- Use `verbatimModuleSyntax: true` for ESM modules

### Linting & Formatting
- ESLint configuration: `eslint.config.mjs` (flat config)
- Prettier configuration: `.prettierrc` (100 char line width, 2 space indent)
- EditorConfig: `.editorconfig` (ensures consistent indentation and line endings)
- Line endings: LF (enforced via `.gitattributes`)

### Testing
- Use Vitest for all tests
- Test files: `src/**/*.spec.ts`
- Test fixtures: `tests/fixtures.ts`
- Coverage: run `npm test` (coverage tool needed for reports)
- All tests must pass before committing

## Making Changes

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Follow the code standards above
- Add tests for new functionality
- Update documentation if needed
- Keep commits focused and descriptive

### 3. Run Checks Before Committing
```bash
npm run build    # Ensure TypeScript compilation succeeds
npm run lint     # Ensure ESLint passes (no errors/warnings)
npm test         # Ensure all tests pass
```

### 4. Commit Your Changes
```bash
git commit -m "type: description"
```

Use conventional commit types:
- `feat:` for new features
- `fix:` for bug fixes
- `chore:` for build/tooling changes
- `docs:` for documentation updates
- `test:` for test additions/modifications
- `refactor:` for code refactoring

### 5. Push and Create a Pull Request
```bash
git push -u origin feature/your-feature-name
```

## Adding a New Audit Module

1. Create `src/core/new-guard.ts` with:
   ```typescript
   export async function performNewAudit(): Promise<{
     status: 'ok' | 'issues' | 'warning';
     issues: Array<{ code: string; message: string }>;
     message: string;
   }> {
     // Implementation
   }
   ```

2. Export from `src/index.ts`
3. Add to the audit pipeline in `src/index.ts`
4. Write tests in `src/core/new-guard.spec.ts`
5. Update the README audit table

## Adding a Validation Preset

1. Create `src/presets/my-preset.ts` with:
   ```typescript
   import { z } from 'zod';
   
   export const myPresetSchema = z.object({
     VAR_NAME: z.string(),
     // ... more validations
   });
   ```

2. Add preset definition to `src/config/presets.ts`
3. Document in README

## Project Structure

```
src/
├── index.ts                  # Main CLI entry & public API
├── env.ts                    # Environment engine
├── core/                     # Core audit modules
├── rules/                    # Audit rules (bundle, cache, dead code, etc.)
├── presets/                  # Validation schemas
├── config/                   # Configuration
├── utils/                    # Utilities
├── cli/                      # CLI workflow
└── renderers/                # Output rendering

tests/
└── fixtures.ts               # Test data

examples/
└── express-prisma/           # Demo server (optional)
```

## Questions or Issues?

- **Bug reports**: Open an issue with a clear description and reproduction steps
- **Feature requests**: Open an issue with a detailed description of the use case
- **Questions**: Use GitHub Discussions or open an issue with `[QUESTION]` prefix

## License

By contributing, you agree that your contributions will be licensed under the ISC License (see LICENSE file).

---

Thank you for contributing to Muraqib! 🔍✨

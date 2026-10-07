# Support & Help

Welcome! If you need help with Muraqib, this guide will help you find the right resources.

## 📚 Documentation

- **[README.md](README.md)** — Overview, features, quick start, and API reference
- **[CLAUDE.md](CLAUDE.md)** — Architecture, development commands, and implementation patterns
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — How to contribute to the project
- **[SECURITY.md](SECURITY.md)** — Security policy and vulnerability reporting
- **[CHANGELOG.md](CHANGELOG.md)** — Version history and release notes

## ❓ Common Questions

### How do I get started?
See the [Quick Start](README.md#-quick-start) section in the README.

### How do I validate environment variables?
Check the [Environment Validation](README.md#-environment-validation) section for examples of using `createEnv()`, `safeCreateEnv()`, and presets.

### How do I run an audit on my project?
1. Make sure a server is running on `http://localhost:3000`
2. Run: `npm run audit`
3. Or for a complete audit with build verification: `npm run audit:ci`

### How do I add a custom validation preset?
See "Adding a Validation Preset" in [CLAUDE.md](CLAUDE.md#adding-a-validation-preset).

### How do I add a new audit module?
See "Adding a New Audit Module" in [CLAUDE.md](CLAUDE.md#adding-a-new-audit-module).

### What Node.js versions are supported?
Muraqib requires **Node.js >= 18.0.0**. It's tested on 18.x, 20.x, and 22.x.

## 🐛 Reporting Bugs

Found a bug? Please help us fix it!

1. **Check if it's already reported** — Search [existing issues](https://github.com/Ayaalmadhon2004/Muraqib/issues)
2. **Create a new issue** — Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
3. **Include**:
   - Node.js and npm versions
   - Error message or stack trace
   - Steps to reproduce
   - Expected vs actual behavior

For **security vulnerabilities**, see [SECURITY.md](SECURITY.md) instead of opening a public issue.

## 💡 Requesting Features

Have an idea to improve Muraqib?

1. **Check existing requests** — Search [GitHub Discussions](https://github.com/Ayaalmadhon2004/Muraqib/discussions) or [issues](https://github.com/Ayaalmadhon2004/Muraqib/issues)
2. **Create a feature request** — Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
3. **Include**:
   - Clear description of the feature
   - Problem it solves
   - Proposed implementation
   - Use cases or examples

## 💬 Getting Help

### Discussion Forums
- [GitHub Discussions](https://github.com/Ayaalmadhon2004/Muraqib/discussions) — Ask questions and share ideas

### Direct Contact
- Email: **aya.alaasel123@gmail.com**
- For security issues: See [SECURITY.md](SECURITY.md)

## 🚀 Development Help

If you want to contribute or need development environment help:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Review [CLAUDE.md](CLAUDE.md) for architecture details
3. Run local development: `npm run dev`
4. Run tests: `npm test`
5. Check code style: `npm run lint`

## 📦 Package Management

### Installation Issues
If you have trouble installing Muraqib:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Type Errors
Make sure you have:
- TypeScript >= 5.0
- `@types/node` installed

Check your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "types": ["node"]
  }
}
```

## 🔄 Updates

- **Current Version**: Check [package.json](package.json) or run `npm view muraqib version`
- **Latest Changes**: See [CHANGELOG.md](CHANGELOG.md)
- **Upgrade**: `npm install muraqib@latest`

## ⚖️ Community

- Please follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- Be respectful and constructive in all interactions
- Read our [Contributing Guidelines](CONTRIBUTING.md)

---

**Can't find what you need?** [Open a discussion](https://github.com/Ayaalmadhon2004/Muraqib/discussions) or email us at **aya.alaasel123@gmail.com**!

/*
### 🔍 Dependency & Architecture Auditor (`dependency-audit.ts`)

An advanced auditing utility designed to analyze project source code dependencies, detect structural issues, and ensure code health by scanning TypeScript/JavaScript files.

#### Key Features:
* **Deprecated API Detection:** Scans codebase for obsolete or deprecated APIs (e.g., `url.parse`, `fs.exists`, `__dirname` in ESM) and suggests modern alternatives.
* **Circular Dependency Detection:** Builds a file relationship graph and runs a Depth-First Search (DFS) algorithm to locate cyclic module imports.
* **Version & Lockfile Inspection:** Analyzes `package.json` for potentially unstable `v0.x` packages and scans lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`) for duplicate package versions.
*/
import fs from "fs";
import path from "path";
import { scanProjectFiles } from "../utils/file-scanner.js";

export interface DependencyAuditResult {
  isClean: boolean;
  reports: string[];
  circularDependencies: string[][];
  outdatedPackages: string[];
  duplicatePackages: string[];
  deprecatedImports: string[];
}

const DEPRECATED_APIS: Record<string, string> = {
  "url.parse": "Use new URL() constructor instead",
  "querystring": "Use URLSearchParams instead",
  "crypto.createDecipher": "Use crypto.createDecipheriv instead",
  "Buffer": "Use Buffer.from() or Buffer.alloc() explicitly",
  "fs.exists": "Use fs.existsSync or fs.promises.access instead",
  "process.binding": "Deprecated internal API",
  "__dirname": "Use import.meta.url with fileURLToPath instead (ESM)",
  "require": "Use dynamic import() instead (ESM)",
};

export function performDependencyAudit(targetPath: string): DependencyAuditResult {
  const reports: string[] = [];
  const circularDependencies: string[][] = [];
  const outdatedPackages: string[] = [];
  const duplicatePackages: string[] = [];
  const deprecatedImports: string[] = [];

  const scannedFiles = scanProjectFiles(targetPath, ["ts", "js"]);

  const graph: Map<string, Set<string>> = new Map();

  for (const scannedFile of scannedFiles) {
    const { relativePath, content, fullPath } = scannedFile;
    graph.set(relativePath, new Set());

    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath) continue;

      for (const [deprecated, suggestion] of Object.entries(DEPRECATED_APIS)) {
        if (content.includes(deprecated)) {
          deprecatedImports.push(`${relativePath}: ${deprecated} — ${suggestion}`);
          reports.push(`Deprecated API usage: ${relativePath} uses ${deprecated}`);
        }
      }

      if (importPath.startsWith(".") || importPath.startsWith("/")) {
        const resolved = path.resolve(path.dirname(fullPath), importPath);
        const possiblePaths = [
          resolved,
          resolved + ".ts",
          resolved + ".js",
          path.join(resolved, "index.ts"),
          path.join(resolved, "index.js"),
        ];

        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            const targetRelative = path.relative(targetPath, p);
            graph.get(relativePath)!.add(targetRelative);
            break;
          }
        }
      }
    }
  }

  // Detect circular dependencies using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const pathStack: string[] = [];

  function dfs(node: string): void {
    visited.add(node);
    recursionStack.add(node);
    pathStack.push(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = pathStack.indexOf(neighbor);
        const cycle = pathStack.slice(cycleStart).concat([neighbor]);
        circularDependencies.push(cycle);
        reports.push(`Circular dependency detected: ${cycle.join(" → ")}`);
      }
    }

    pathStack.pop();
    recursionStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  // Check package.json for duplicates and outdated
  const packageJsonPath = path.join(targetPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    const depNames = Object.keys(allDeps);
    for (const dep of depNames) {
      const version = allDeps[dep];
      if (version && version.startsWith("^0.")) {
        outdatedPackages.push(`${dep}@${version} — v0.x may have breaking changes`);
        reports.push(`Potentially outdated: ${dep}@${version} (v0.x detected)`);
      }
    }

    const lockPaths = [
      path.join(targetPath, "package-lock.json"),
      path.join(targetPath, "yarn.lock"),
      path.join(targetPath, "pnpm-lock.yaml"),
    ];

    for (const lockPath of lockPaths) {
      if (fs.existsSync(lockPath)) {
        const lockContent = fs.readFileSync(lockPath, "utf-8");
        const packageCounts: Map<string, number> = new Map();

        const nameRegex = /"([^"]+@\d+\.\d+\.\d+)"/g;
        let lockMatch;
        while ((lockMatch = nameRegex.exec(lockContent)) !== null) {
          const fullName = lockMatch[1];
          if (!fullName) continue;
          const pkgName = fullName.split("@")[0];
          if (!pkgName) continue;
          packageCounts.set(pkgName, (packageCounts.get(pkgName) || 0) + 1);
        }

        for (const [pkgName, count] of packageCounts) {
          if (count > 1) {
            duplicatePackages.push(`${pkgName} (${count} versions in lock file)`);
            reports.push(`Duplicate package versions: ${pkgName} appears ${count} times`);
          }
        }
      }
    }
  }

  return {
    isClean: reports.length === 0,
    reports,
    circularDependencies,
    outdatedPackages,
    duplicatePackages,
    deprecatedImports,
  };
}
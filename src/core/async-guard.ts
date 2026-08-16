import fs from "fs";
import path from "path";

export interface ConfigAuditResult {
  isValid: boolean;
  reports: string[];
  missingFiles: string[];
  invalidConfigs: string[];
  insecureConfigs: string[];
}

const REQUIRED_CONFIG_FILES = [
  "tsconfig.json",
  ".gitignore",
  "package.json",
];

const SECURITY_SENSITIVE_KEYS = [
  "password",
  "secret",
  "token",
  "api_key",
  "private_key",
  "auth",
  "credential",
];

export function performConfigAudit(targetPath: string): ConfigAuditResult {
  const reports: string[] = [];
  const missingFiles: string[] = [];
  const invalidConfigs: string[] = [];
  const insecureConfigs: string[] = [];

  // Check required config files
  for (const file of REQUIRED_CONFIG_FILES) {
    const filePath = path.join(targetPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
      reports.push(`Missing required config file: ${file}`);
    }
  }

  // Check tsconfig.json
  const tsconfigPath = path.join(targetPath, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));

      if (!tsconfig.compilerOptions) {
        invalidConfigs.push("tsconfig.json missing compilerOptions");
        reports.push("tsconfig.json: missing compilerOptions section");
      } else {
        if (tsconfig.compilerOptions.strict !== true) {
          insecureConfigs.push("tsconfig.json: strict mode disabled");
          reports.push("tsconfig.json: strict mode is disabled — enable for type safety");
        }
        if (tsconfig.compilerOptions.noImplicitAny !== true) {
          insecureConfigs.push("tsconfig.json: noImplicitAny disabled");
          reports.push("tsconfig.json: noImplicitAny is disabled — enable to catch implicit any types");
        }
        if (tsconfig.compilerOptions.noUnusedLocals !== true) {
          reports.push("tsconfig.json: noUnusedLocals is disabled — enable to catch dead code");
        }
        if (tsconfig.compilerOptions.noUnusedParameters !== true) {
          reports.push("tsconfig.json: noUnusedParameters is disabled — enable to catch unused params");
        }
        if (tsconfig.compilerOptions.exactOptionalPropertyTypes !== true) {
          reports.push("tsconfig.json: exactOptionalPropertyTypes is disabled — enable for stricter optional types");
        }
      }
    } catch (e) {
      invalidConfigs.push("tsconfig.json is invalid JSON");
      reports.push("tsconfig.json: invalid JSON format");
    }
  }

  // Check package.json
  const packagePath = path.join(targetPath, "package.json");
  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

      if (!pkg.scripts || !pkg.scripts.test) {
        reports.push("package.json: missing test script");
      }
      if (!pkg.scripts || !pkg.scripts.build) {
        reports.push("package.json: missing build script");
      }
      if (!pkg.scripts || !pkg.scripts.lint) {
        reports.push("package.json: missing lint script");
      }

      // Check for security-sensitive values in package.json
      const pkgStr = JSON.stringify(pkg);
      for (const key of SECURITY_SENSITIVE_KEYS) {
        const regex = new RegExp(`"${key}\s*":\s*"[^"]+"`, "i");
        if (regex.test(pkgStr)) {
          insecureConfigs.push(`package.json contains exposed ${key}`);
          reports.push(`Security risk: package.json exposes ${key} in plaintext`);
        }
      }
    } catch (e) {
      invalidConfigs.push("package.json is invalid JSON");
      reports.push("package.json: invalid JSON format");
    }
  }

  // Check .env files for exposed secrets
  const envFiles = fs.readdirSync(targetPath).filter((f) => f.startsWith(".env"));
  for (const envFile of envFiles) {
    const envPath = path.join(targetPath, envFile);
    const envContent = fs.readFileSync(envPath, "utf-8");

    for (const key of SECURITY_SENSITIVE_KEYS) {
      const regex = new RegExp(`${key}=.+`, "i");
      if (regex.test(envContent)) {
        insecureConfigs.push(`${envFile} contains ${key}`);
        reports.push(`Security risk: ${envFile} exposes ${key} — use a secrets manager`);
      }
    }

    // Check if .env is in .gitignore
    const gitignorePath = path.join(targetPath, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, "utf-8");
      if (!gitignore.includes(".env")) {
        insecureConfigs.push(".env not in .gitignore");
        reports.push("Security risk: .env files are not in .gitignore — secrets may be committed");
      }
    }
  }

  // Check for .env in repo (shouldn't be committed)
  const gitPath = path.join(targetPath, ".git");
  if (fs.existsSync(gitPath)) {
    const trackedEnv = path.join(targetPath, ".env");
    if (fs.existsSync(trackedEnv)) {
      try {
        const { execSync } = require("child_process");
        const isTracked = execSync("git ls-files .env", { cwd: targetPath, encoding: "utf-8" }).trim();
        if (isTracked) {
          insecureConfigs.push(".env is tracked by git");
          reports.push("Critical security risk: .env is tracked by git — secrets are exposed in version control");
        }
      } catch (e) {
        // git command failed, skip
      }
    }
  }

  return {
    isValid: reports.length === 0,
    reports,
    missingFiles,
    invalidConfigs,
    insecureConfigs,
  };
}
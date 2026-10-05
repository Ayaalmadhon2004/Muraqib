import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { performConfigAudit } from "./config-guard.ts";

const temporaryProjects: string[] = [];

function createProject(): string {
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), "muraqib-config-guard-"));
  temporaryProjects.push(projectPath);
  fs.writeFileSync(
    path.join(projectPath, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noUncheckedIndexedAccess: true,
        noImplicitAny: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        exactOptionalPropertyTypes: true,
      },
    }),
  );
  fs.writeFileSync(
    path.join(projectPath, "package.json"),
    JSON.stringify({ scripts: { test: "test", build: "build", lint: "lint" }, author: "Ada" }),
  );
  fs.writeFileSync(path.join(projectPath, ".gitignore"), ".env\n.env.*\n!.env.example\n");
  execFileSync("git", ["init", "--quiet"], { cwd: projectPath });
  return projectPath;
}

afterEach(() => {
  for (const projectPath of temporaryProjects.splice(0)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
});

describe("performConfigAudit", () => {
  it("does not mistake author or public URLs for secrets", () => {
    const projectPath = createProject();
    fs.writeFileSync(
      path.join(projectPath, "package.json"),
      JSON.stringify({
        scripts: {
          test: "vitest run",
          build: "tsc",
          lint: "eslint . --ext .ts,.tsx",
          audit: "tsx src/index.ts --url https://localhost:3000",
        },
        author: "Ada",
        homepage: "https://example.com/project",
        bugs: { url: "https://example.com/project/issues" },
        repository: { type: "git", url: "git+https://github.com/example/project.git" },
      }),
    );
    fs.writeFileSync(
      path.join(projectPath, ".env.example"),
      "AUTHOR=project maintainer\nPUBLIC_URL=https://example.com\nDATABASE_URL=https://example.com/db\n",
    );

    const result = performConfigAudit(projectPath);

    expect(result.insecureConfigs).toEqual([]);
    expect(result.reports).toEqual([]);
  });

  it("detects secrets embedded in URL query parameters", () => {
    const projectPath = createProject();
    fs.writeFileSync(path.join(projectPath, ".env.local"), "CALLBACK=https://example.com/?access_token=abc123456789\n");

    const result = performConfigAudit(projectPath);

    expect(result.insecureConfigs).toContain(".env.local contains exposed CALLBACK");
  });

  it("scans nested env files for secret patterns and sensitive Muraqib keys", () => {
    const projectPath = createProject();
    const nestedConfig = path.join(projectPath, "config");
    fs.mkdirSync(nestedConfig);
    fs.writeFileSync(
      path.join(nestedConfig, ".env.production"),
      [
        "AUTHOR=project maintainer",
        "AUTH=Bearer valid-value",
        "PUBLIC_URL=https://example.com",
        "TOKEN=",
        "JWT=eyJhbGci.abc123.xyz987",
        "DATABASE_URL=postgres://alice:secret@db.example.com/app",
        "MURAQIB_DB_URL=postgres://localhost/internal",
        "PRIVATE_KEY=-----BEGIN PRIVATE KEY-----",
        "CACHE_MARKER=M8p#xQ2!vL9@cR4$zT7%kW5^",
      ].join("\n"),
    );

    const result = performConfigAudit(projectPath);

    expect(result.insecureConfigs).toContain("config/.env.production contains exposed JWT");
    expect(result.insecureConfigs).toContain("config/.env.production contains exposed DATABASE_URL");
    expect(result.insecureConfigs).toContain("config/.env.production contains exposed MURAQIB_DB_URL");
    expect(result.insecureConfigs).toContain("config/.env.production contains exposed PRIVATE_KEY");
    expect(result.insecureConfigs).toContain("config/.env.production contains exposed CACHE_MARKER");
    expect(result.insecureConfigs.some((finding) => finding.includes("AUTHOR"))).toBe(false);
    expect(result.insecureConfigs).toContain("config/.env.production contains exposed AUTH");
    expect(result.insecureConfigs.some((finding) => finding.includes("PUBLIC_URL"))).toBe(false);
    expect(result.insecureConfigs.some((finding) => finding.includes("TOKEN"))).toBe(false);
  });

  it("detects tracked nested env files while allowing tracked example templates", () => {
    const projectPath = createProject();
    const configPath = path.join(projectPath, "config");
    fs.mkdirSync(configPath);
    fs.writeFileSync(path.join(configPath, ".env.production"), "PORT=3000\n");
    fs.writeFileSync(path.join(projectPath, ".env.example"), "PORT=3000\n");
    execFileSync("git", ["add", "-f", "config/.env.production", ".env.example"], {
      cwd: projectPath,
    });
    fs.rmSync(path.join(configPath, ".env.production"));

    const result = performConfigAudit(projectPath);

    expect(result.insecureConfigs).toContain("config/.env.production is tracked by git");
    expect(result.insecureConfigs.some((finding) => finding.includes(".env.example"))).toBe(false);
  });

  it("requires ignore rules to cover environment variants", () => {
    const projectPath = createProject();
    fs.writeFileSync(path.join(projectPath, ".gitignore"), ".env\n");

    const result = performConfigAudit(projectPath);

    expect(result.insecureConfigs).toContain(".gitignore does not protect .env.production");
  });

  it("requires strict and unchecked indexed access compiler options", () => {
    const projectPath = createProject();
    fs.writeFileSync(
      path.join(projectPath, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true, noUncheckedIndexedAccess: false } }),
    );

    const result = performConfigAudit(projectPath);

    expect(result.insecureConfigs).toContain("tsconfig.json: noUncheckedIndexedAccess disabled");
    expect(result.insecureConfigs).toContain("tsconfig.json: noImplicitAny disabled");
  });
});

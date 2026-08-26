import fs from "fs";
import path from "path";
import { z } from "zod";
import { presetsMap } from "./presets.js";
import { createGuard } from "./core/standard.js";
import { isWithinSchedule } from "./utils/schedule-validator.js";
// =========================================================================
// 0.  إعدادات عامة وثوابت
// =========================================================================
const SKIP_ENV_VALIDATION = process.env.SKIP_ENV_VALIDATION === "true" || process.env.SKIP_ENV_VALIDATION === "1";
/**
 * 🌟 محمّل .env متقدم — يدعم:
 *   • inline comments:  KEY=value # هذا تعليق
 *   • multiline values:  KEY="line1\nline2"  أو  KEY=line1\nline2
 *   • variable expansion: DATABASE_URL=$BASE_URL/db
 *   • quotes handling:   KEY='value' أو KEY="value"
 */
export function loadEnv(options = {}) {
    const cwd = options.cwd ?? process.cwd();
    const nodeEnv = process.env.NODE_ENV ?? "development";
    const files = options.files ?? [".env", `.env.${nodeEnv}`, ".env.local"];
    const loaded = {};
    for (const file of files) {
        const filePath = path.join(cwd, file);
        if (!fs.existsSync(filePath))
            continue;
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const lines = content.split(/\r?\n/);
            let pendingKey = null;
            let pendingValue = "";
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();
                // تعليق كامل
                if (!trimmed || trimmed.startsWith("#"))
                    continue;
                // multiline continuation (ends with \)
                if (pendingKey !== null) {
                    pendingValue += "\n" + line.replace(/\\$/, "").trimEnd();
                    if (!line.endsWith("\\")) {
                        loaded[pendingKey] = pendingValue;
                        if (options.verbose) {
                            console.log(`📄 [Muraqib Loader]: Loaded ${pendingKey} from ${file}`);
                        }
                        pendingKey = null;
                    }
                    continue;
                }
                // inline comment: نفصل على أول # بس لو مش داخل quotes
                const commentIndex = findCommentIndex(trimmed);
                const meaningful = commentIndex >= 0 ? trimmed.slice(0, commentIndex) : trimmed;
                // export prefix
                const withoutExport = meaningful.replace(/^export\s+/, "").trim();
                const eqIndex = withoutExport.indexOf("=");
                if (eqIndex < 0)
                    continue;
                const key = withoutExport.slice(0, eqIndex).trim();
                let rawValue = withoutExport.slice(eqIndex + 1).trim();
                // quotes handling (supports newlines inside quotes via /s flag)
                const quoteMatch = rawValue.match(/^(['"])(.*)\1$/s);
                if (quoteMatch) {
                    rawValue = quoteMatch[2] ?? rawValue;
                }
                pendingKey = key;
                pendingValue = rawValue;
                if (!line.endsWith("\\")) {
                    loaded[key] = rawValue;
                    if (options.verbose) {
                        console.log(`📄 [Muraqib Loader]: Loaded ${key} from ${file}`);
                    }
                    pendingKey = null;
                }
            }
            // handle last line if it was multiline and file ended
            if (pendingKey !== null) {
                loaded[pendingKey] = pendingValue;
                if (options.verbose) {
                    console.log(`📄 [Muraqib Loader]: Loaded ${pendingKey} from ${file}`);
                }
            }
        }
        catch (e) {
            console.warn(`⚠️ [Muraqib Loader]: Failed to load ${filePath}`);
        }
    }
    // expansion: $VAR و ${VAR} و ${VAR:-default} — نسويها بعد ما نخلص parse كل الملفات
    for (const key of Object.keys(loaded)) {
        loaded[key] = expandVariables(loaded[key], { ...process.env, ...loaded });
    }
    // merge into process.env
    if (!options.preserveProcessEnv) {
        for (const [k, v] of Object.entries(loaded)) {
            process.env[k] = v;
        }
    }
    // Provide safe development defaults when env vars are missing so audits and local servers run
    process.env.PORT = process.env.PORT || "3000";
    process.env.STATIC_ASSETS_CACHE_MAX_AGE = process.env.STATIC_ASSETS_CACHE_MAX_AGE || "86400";
    process.env.ENABLE_SERVER_COMPRESSION = process.env.ENABLE_SERVER_COMPRESSION || "true";
    return loaded;
}
/** يلاقي أول # مش داخل quotes (مع دعم escaped quotes) */
function findCommentIndex(str) {
    let inQuotes = null;
    let escaped = false;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (ch === "\\") {
            escaped = true;
            continue;
        }
        if (ch === '"' || ch === "'") {
            if (inQuotes === ch)
                inQuotes = null;
            else if (!inQuotes)
                inQuotes = ch;
        }
        else if (ch === "#" && !inQuotes) {
            return i;
        }
    }
    return -1;
}
/** يفكّ $VAR و ${VAR} و ${VAR:-default} */
function expandVariables(value, env) {
    return value.replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)(?::-([^}]*))?\}?/g, (_, name, def) => {
        return env[name] ?? def ?? "";
    });
}
// =========================================================================
// 4.  المحرك المعماري الأساسي (مُكمل ومُصلّح)
// =========================================================================
export function createEnv(opts) {
    // ── load .env files ──
    if (opts.envFilePath) {
        const files = Array.isArray(opts.envFilePath) ? opts.envFilePath : [opts.envFilePath];
        loadEnv({ files, preserveProcessEnv: opts.preserveProcessEnv ?? false, verbose: !opts.silent });
    }
    // ── schedule check ──
    if (opts.schedule) {
        const allowedToRun = isWithinSchedule(opts.schedule);
        if (!allowedToRun) {
            if (!opts.silent) {
                console.warn(`⏳ [Muraqib Scheduler]: Process halted automatically. Current time is outside allowed cron window.`);
            }
            return null;
        }
    }
    // ── skip validation (CI/build) ──
    if (opts.skipValidation ?? SKIP_ENV_VALIDATION) {
        if (!opts.silent) {
            console.log(`⏭️ [Muraqib Guards]: Validation skipped (skipValidation=true).`);
        }
        return process.env;
    }
    const rawSchemaFields = {
        ...opts.server,
        ...opts.client,
    };
    const combinedSchema = z.object(rawSchemaFields);
    const rawEnv = opts.runtimeEnvStrict ?? opts.runtimeEnv ?? process.env;
    const processedEnv = { ...rawEnv };
    if (opts.extends && Array.isArray(opts.extends)) {
        for (const extendedEnv of opts.extends) {
            if (extendedEnv && typeof extendedEnv === "object") {
                Object.assign(processedEnv, extendedEnv);
            }
        }
    }
    const shouldSanitize = opts.emptyStringAsUndefined ?? true;
    if (shouldSanitize) {
        for (const key in processedEnv) {
            if (processedEnv[key] === "") {
                processedEnv[key] = undefined;
            }
        }
    }
    if (!opts.silent) {
        console.log(`🛡️ [Muraqib Guards]: Building and executing runtime environment integrity validations...`);
    }
    // ── validation ──
    const validationResult = combinedSchema.safeParse(processedEnv);
    if (!validationResult.success) {
        const issues = validationResult.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
        }));
        const formattedMessage = opts.formatError
            ? opts.formatError(issues)
            : `💥 [Muraqib Guards Error]: Environment core validation crashed with ${issues.length} violation(s)!\n\n` +
                issues.map((i) => `  • ${i.path}: ${i.message}`).join("\n");
        if (!opts.silent) {
            console.error(formattedMessage);
        }
        const error = new Error(formattedMessage);
        error.isMuraqibCustom = true;
        error.errors = issues;
        throw error;
    }
    try {
        const validatedGuard = createGuard(combinedSchema, {
            runtimeEnv: processedEnv,
            isServer: opts.isServer ?? typeof window === "undefined",
            emptyStringAsUndefined: shouldSanitize,
        });
        return (validatedGuard?.data ?? validatedGuard);
    }
    catch (validationError) {
        throw validationError;
    }
}
// =========================================================================
// 5.  safeCreateEnv — بيرجّع نتيجة بدل ما يرمي (جديد)
// =========================================================================
export function safeCreateEnv(opts) {
    try {
        const data = createEnv(opts);
        if (data === null) {
            return { success: false, error: [{ path: "schedule", message: "Outside allowed schedule window." }] };
        }
        return { success: true, data: data };
    }
    catch (e) {
        if (e.isMuraqibCustom && Array.isArray(e.errors)) {
            return { success: false, error: e.errors };
        }
        return { success: false, error: [{ path: "unknown", message: e.message ?? "Unknown error" }] };
    }
}
// =========================================================================
// 6.  الدالة المغلّفة المسهلة (Presets Wrapper) — مُكملة
// =========================================================================
export function createEnvWithPresets(userSchema, options) {
    const serverSchema = { ...userSchema };
    if (options.presets && Array.isArray(options.presets)) {
        for (const presetName of options.presets) {
            const preset = presetsMap[presetName];
            if (preset) {
                if (!options.silent) {
                    console.log(`📦 [Muraqib Presets]: Injecting centralized validation schema for [${presetName}].`);
                }
                Object.assign(serverSchema, preset);
            }
            else if (!options.silent) {
                console.warn(`⚠️ [Muraqib Presets]: Unknown preset [${presetName}] — skipped.`);
            }
        }
    }
    return createEnv({
        server: serverSchema,
        runtimeEnv: options.runtimeEnv ?? process.env,
        emptyStringAsUndefined: options.emptyStringAsUndefined,
        isServer: options.isServer,
        schedule: options.schedule,
        skipValidation: options.skipValidation,
        silent: options.silent,
        formatError: options.formatError,
        envFilePath: options.envFilePath,
        preserveProcessEnv: options.preserveProcessEnv,
    });
}
//# sourceMappingURL=env.js.map
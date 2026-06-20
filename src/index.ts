import { z } from "zod";
import { createEnv, createEnvWithPresets } from "./env.js";
import { cachePerformanceSchema } from "./rules/cache-guard.js";
import { runImagePerformanceAudit } from "./core/performance/image-guard.js";
import { runComprehensiveBundleAudit } from "./rules/bundle-budget.js";
import { performLiveLatencyAudit } from './core/performance/network-latency-advisor.js';

export { createEnv, createEnvWithPresets } from "./env.js";
export * from "./core/types.js";
export * from "./core/standard.js";

async function runMuraqibPlayground() {
  console.log(`===========================================================`);
  console.log(`🛡️  [Muraqib Facade Playground]: Initiating System Audits...`);
  console.log(`===========================================================\n`);

  // --- [المحطة الأولى: فحص الصور الساكنة] ---
  try {
    runImagePerformanceAudit();
  } catch (error) {
    console.error("🚨 Error during image auditing:", error);
  }

  // --- [المحطة الثانية: فحص الـ Bundle الديناميكي الشامل] ---
  try {
    runComprehensiveBundleAudit();
  } catch (error) {
    console.error("🚨 Error during bundle diagnostics:", error);
  }

  // --- [المحطة الثالثة: فحص الشبكة والـ Latency الحية] ---
  try {
    await performLiveLatencyAudit('https://jsonplaceholder.typicode.com/comments');
  } catch (error) {
    console.error("🚨 Error during network check:", error);
  }

  // --- [المحطة الرابعة: فحص الـ .env الشامل والموحد] ---
  try {
    console.log("\n🧬 [Muraqib Core]: Booting up Live Environment Integrity Audits...");
    
    // 🌟 دمج متكامل ومغلق الأقواس بشكل سليم لجمع كل الانتهاكات معاً
    createEnvWithPresets(
      {
        DATABASE_URL: z.string().url(),
        PORT: z.string().transform(Number).pipe(z.number({ invalid_type_error: "Must be a valid numeric string" })),
        ...cachePerformanceSchema 
      },
      {
        runtimeEnv: process.env, 
        presets: ["next"],
        isServer: true
      }
    );

  } catch (error: any) {
    console.log(`\n🚨 [Muraqib Intercepted]: Validation caught runtime errors directly from the physical .env file!`);
    
    let finalErrorsToDisplay: any[] = [];

    if (error && error.isMuraqibCustom && Array.isArray(error.errors)) {
      finalErrorsToDisplay = error.errors.map((e: any) => ({ Field: e.path, Message: e.message }));
    } else if (error && error.issues && Array.isArray(error.issues)) {
      finalErrorsToDisplay = error.issues.map((e: any) => ({ Field: e.path.join('.'), Message: e.message }));
    } else if (error && error.errors && Array.isArray(error.errors)) {
      finalErrorsToDisplay = error.errors.map((e: any) => ({
        Field: Array.isArray(e.path) ? e.path.join('.') : (e.field || 'UNKNOWN'),
        Message: e.message
      }));
    }

    if (finalErrorsToDisplay.length > 0) {
       console.table(finalErrorsToDisplay);
    } else {
       console.error("📋 Raw Error Log:", error);
    }
  }
}

// تشغيل الـ Playground فقط إذا تم استدعاء الملف مباشرة للتنفيذ
const isMainModule = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;
if (isMainModule || process.argv[1]?.endsWith('index.ts')) {
    runMuraqibPlayground();
}
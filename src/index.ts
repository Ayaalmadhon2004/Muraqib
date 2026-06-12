// src/index.ts
import { z } from "zod";
import path from "path";
import { createEnv, createEnvWithPresets } from "./env.js";
import { cachePerformanceSchema } from "./rules/cache-guard.js";
import { runImagePerformanceAudit } from "./core/performance/image-guard.js";
import { runComprehensiveBundleAudit } from "./rules/bundle-budget.js";
import { performLiveLatencyAudit } from './core/performance/network-latency-advisor.js';

// 🏛️ 1. الـ Facade Pattern: تصدير الواجهات النظيفة للعالم الخارجي دون تلويث
export { createEnv, createEnvWithPresets } from "./env.js";
export * from "./core/types.js";
export * from "./core/standard.js";

// 🚀 2. حلبة الاختبار الذكية والمنسقة (Playground Boundary)
async function runMuraqibPlayground() {
  console.log(`===========================================================`);
  console.log(`🛡️  [Muraqib Facade Playground]: Initiating System Audits...`);
  console.log(`===========================================================\n`);

  // --- [المحطة الأولى: فحص الصور] ---
  try {
    runImagePerformanceAudit();
  } catch (error) {
    console.error("🚨 Error during image auditing:", error);
  }

  // --- [المحطة الثانية: فحص الـ Bundle] ---
  const simulatedBundleSizeInBytes = 25 * 1024; // 25 KB
  const activeUserFile = path.join(process.cwd(), "src/app/page.tsx");
  try {
    runComprehensiveBundleAudit(simulatedBundleSizeInBytes, activeUserFile);
  } catch (error) {
    console.error("🚨 Error during bundle diagnostics:", error);
  }

  // --- [المحطة الثالثة: فحص الشبكة والـ Latency الحية] ---
  try {
    await performLiveLatencyAudit('https://jsonplaceholder.typicode.com/posts/1'); 
  } catch (error) {
    console.error("🚨 Error during network check:", error);
  }

  // --- [المحطة الرابعة: فحص الـ .env والإعدادات] ---
  try {
    console.log("\n🧬 Simulating Successful Environment Generation...");
    createEnvWithPresets(
      { DATABASE_URL: z.string().url(), PORT: z.string().transform(Number) },
      {
        runtimeEnv: {
          DATABASE_URL: "postgresql://localhost:5432/muraqib_db",
          PORT: "3000",
        },
        presets: ["next"],
        isServer: true
      }
    );

    console.log("\n📉 Testing Cache Performance Rules (Intentional Failure simulation)...");
    createEnv({
      server: { ...cachePerformanceSchema },
      runtimeEnv: {
        STATIC_ASSETS_CACHE_MAX_AGE: "600", // ❌ قيمة صغيرة جداً ستطلق تحذيراً
        ENABLE_SERVER_COMPRESSION: "false"
      }
    });

  } catch (error: any) {
    console.log(`\n🚨 [Muraqib Intercepted]: Validation caught inside the Facade Boundary!`);
  }
}

// تشغيل الـ Playground فقط إذا تم استدعاء الملف مباشرة للتنفيذ
const isMainModule = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;
if (isMainModule || process.argv[1]?.endsWith('index.ts')) {
    runMuraqibPlayground();
}
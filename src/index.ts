// src/index.ts
// =========================================================================
// 🏛️ الـ Facade Pattern: تصدير كافة واجهات ودوال الأداة للعالم الخارجي
// =========================================================================
export { createEnv, createEnvWithPresets } from "./env.js";
export * from "./core/types.js";
export * from "./core/standard.js";

// =========================================================================
// 🚀 حلبة الاختبار الذكية (Playground / Execution Boundary)
// =========================================================================
import { createEnvWithPresets } from "./env.js";
import { z } from "zod";

const isMainModule = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;

if (isMainModule || process.argv[1]?.endsWith('index.ts')) {
  console.log(`===========================================================`);
  console.log(`🛡️  [Muraqib Facade Playground]: Initiating Architectural Integrity Tests...`);
  console.log(`===========================================================\n`);

  try {
    // 🧪 السيناريو الأول: فحص التشغيل الناجح مع حقن الـ Presets والجدولة الزمنية
    console.log("-----------------------------------------------------------");
    console.log("🧬 [TEST 1]: Simulating Successful Environment Generation...");
    console.log("-----------------------------------------------------------");
    
    const validConfig = createEnvWithPresets(
      {
        DATABASE_URL: z.string().url(),
        PORT: z.string().transform(Number),
      },
      {
        runtimeEnv: {
          DATABASE_URL: "postgresql://localhost:5432/muraqib_db",
          PORT: "3000",
          NEXT_PUBLIC_APP_URL: "https://muraqib.dev" 
        },
        presets: ["next"], 
        emptyStringAsUndefined: true,
        schedule: "*/5 * * * *", 
        isServer: true
      }
    );

    console.log("\n✨ [SUCCESS]: Config object fully hydrated and validated:");
    console.log(validConfig);

    console.log("\n-----------------------------------------------------------");
    console.log("💥 [TEST 2]: Simulating Validation Failures (Destructive Testing)...");
    console.log("-----------------------------------------------------------");
    
    // التعديل هنا: تمرير بريزيت مسجل لتجنب الـ undefined وترك حراس Zod يؤدون عملهم الصارم
    createEnvWithPresets(
      {
        DATABASE_URL: z.string().url(),
      },
      {
        runtimeEnv: {
          DATABASE_URL: "not-a-valid-url", // ❌ قيمة مشوهة لضرب الـ Schema
        },
        presets: ["vercel"],
        isServer: true
      }
    );

  } catch (error: any) {
    console.log(`\n🚨 [Muraqib Guard Intercepted]: Error successfully captured inside the Facade Boundary!`);
    if (error && error.errors) {
      console.error(`📋 Violations breakdown:`, JSON.stringify(error.errors, null, 2));
    } else {
      console.error(`❌ Error Message:`, error?.message || error);
    }
  }
}
// test-muraqib.js
import { createEnv } from "./src/index.js";
import { z } from "zod";

console.log("🚀 بـدء فحص نـظـام Muraqib عـبـر الـ Facade...");

try {
  const env = createEnv({
    server: {
      DATABASE_URL: z.string(),
    },
    client: {
      NEXT_PUBLIC_PORT: z.coerce.number(),
    },
    runtimeEnv: {
      DATABASE_URL: "", // 🚨 نص فارغ!
      NEXT_PUBLIC_PORT: "3000"
    },
    isServer: true,
    emptyStringAsUndefined: true // تفعيل التطهير
  });

  console.log("✅ الفحص نجح بنجاح غريب! والمخرجات هي:", env);

} catch (error) {
  console.log("\n🔥 لقطنا الكراش الفوري بنجاح من خلف واجهة الـ Facade!");
  console.log(error.message); // حيطبع تفاصيل الـ JSON المنسق للأخطاء
}
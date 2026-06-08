import { runtimeCacheSchema } from "../../rules/cache-guard.js";

export const runPerformanceAudit = () => {
  console.log("⚡ [Muraqib]: Starting Performance Audit Suite...");
  const result = runtimeCacheSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ [Muraqib Performance]: Invalid configuration in .env");
    process.exit(1);
  }
  console.log("✅ [Muraqib]: Performance Audit Passed.");
  return result.data;
};
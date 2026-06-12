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

//what is this code do ? , amd 
/* and these is the runtime it is just check them , from where we did the extract import { z } from "zod";

export const cachePerformanceSchema = {
  STATIC_ASSETS_CACHE_MAX_AGE: z
    .string()
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 86400, {
      message: "❌ [Muraqib Performance Guard]: Cache max-age must be at least 1 day (86400 seconds).",
    }),
  ENABLE_SERVER_COMPRESSION: z
    .string()
    .or(z.boolean())
    .transform((val) => String(val).toLowerCase() === "true")
    .refine((val) => val === true, {
      message: "⚠️ [Muraqib Performance Warning]: Gzip/Brotli Compression is disabled.",
    }),
};

export const runtimeCacheSchema = z.object({
  ENABLE_SERVER_COMPRESSION: z.string().transform((v) => v === "true"),
  STATIC_ASSETS_CACHE_MAX_AGE: z.string().transform(Number),
});
*/
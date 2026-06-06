// src/core/performance/cache-guard.ts
import { z } from "zod";

const schema = z.object({
  ENABLE_SERVER_COMPRESSION: z.string().transform((val) => val === "true"),
  STATIC_ASSETS_CACHE_MAX_AGE: z.string().transform((val) => Number(val)),
});

export const checkCacheConfig = () => {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ [Muraqib Performance]: Invalid configuration in .env");
    process.exit(1);
  }
  return result.data;
};
// src/rules/cache-guard.ts
import { z } from "zod";

export const cachePerformanceSchema = { // assets chace gurad 
  STATIC_ASSETS_CACHE_MAX_AGE: z
    .string() 
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 86400, {
      message: "❌ [Muraqib Performance Guard]: Cache max-age for static assets must be at least 1 day (86400 seconds) to ensure optimal Staging/Production performance!",
    }),
  
  ENABLE_SERVER_COMPRESSION: z // gzip/brotli compression guard
    .string()
    .or(z.boolean())
    .transform((val) => String(val).toLowerCase() === "true")
    .refine((val) => val === true, {
      message: "⚠️ [Muraqib Performance Warning]: Gzip/Brotli Compression is disabled. Please set ENABLE_SERVER_COMPRESSION=true to reduce asset payload sizes.",
    }),
};

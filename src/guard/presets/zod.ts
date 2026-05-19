import * as z from "zod";
import { createEnv } from "../../index.js"; 
import type { VercelEnv, NeonVercelEnv } from "../../presets.js";

export const vercel = (): Readonly<VercelEnv> =>
  createEnv({
    server: {
      VERCEL: z.string().optional(),
      CI: z.string().optional(),
      VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
      VERCEL_URL: z.string().optional(),
    },
    runtimeEnv: process.env,
  });

export const neonVercel = (): Readonly<NeonVercelEnv> =>
  createEnv({
    server: {
      DATABASE_URL: z.string().url(), 
      DATABASE_URL_UNPOOLED: z.string().optional(),
    },
    runtimeEnv: process.env,
  });
import { optional, string, picklist, pipe, url } from "valibot";
import { createEnv } from "../../index.js";
import type { VercelEnv, NeonVercelEnv } from "../../presets.js";

export const vercel = (): Readonly<VercelEnv> =>
  createEnv({
    server: {
      VERCEL: optional(string()),
      CI: optional(string()),
      VERCEL_ENV: optional(picklist(["development", "preview", "production"])),
      VERCEL_URL: optional(string()),
    },
    runtimeEnv: process.env,
  });

export const neonVercel = (): Readonly<NeonVercelEnv> =>
  createEnv({
    server: {
      DATABASE_URL: pipe(string(), url()), // what is pipe ? and use it
      DATABASE_URL_UNPOOLED: optional(string()),
    },
    runtimeEnv: process.env,
  });
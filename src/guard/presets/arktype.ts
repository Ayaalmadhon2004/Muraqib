import { type } from "arktype";
import { createEnv } from "../../index.js";
import type { VercelEnv, NeonVercelEnv } from "../../presets.js";

export const vercel = (): Readonly<VercelEnv> => 
  createEnv({
    server: {
      VERCEL: type("string | undefined"),
      CI: type("string | undefined"),
      VERCEL_ENV: type("'development' | 'preview' | 'production' | undefined"),
      VERCEL_URL: type("string | undefined"),
    },
    runtimeEnv: process.env,
  });

export const neonVercel = (): Readonly<NeonVercelEnv> =>
  createEnv({
    server: {
      DATABASE_URL: type("string"), 
      DATABASE_URL_UNPOOLED: type("string | undefined"),
    },
    runtimeEnv: process.env,
  });

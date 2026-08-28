import { type } from "arktype";
import type { VercelEnv, NeonVercelEnv } from "../presets.js";

export const vercel = (): Readonly<VercelEnv> => {
  const vercelSchema = type({
    VERCEL: "string | undefined",
    CI: "string | undefined",
    VERCEL_ENV: "'development' | 'preview' | 'production' | undefined",
    VERCEL_URL: "string | undefined",
  });

  const out = vercelSchema(process.env);
  return (out instanceof Error ? {} : out) as unknown as Readonly<VercelEnv>;
};

export const neonVercel = (): Readonly<NeonVercelEnv> => {
  const neonSchema = type({
    DATABASE_URL: "string", 
    DATABASE_URL_UNPOOLED: "string | undefined",
  });

  const out = neonSchema(process.env);
  return (out instanceof Error ? {} : out) as unknown as Readonly<NeonVercelEnv>;
};
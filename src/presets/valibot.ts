import { optional, string, picklist, pipe, url, parse } from "valibot";
import type { VercelEnv, NeonVercelEnv } from "../presets.js";

export const vercel = (): Readonly<VercelEnv> => {
  try {
    const vercelSchema = {
      VERCEL: optional(string()),
      CI: optional(string()),
      VERCEL_ENV: optional(picklist(["development", "preview", "production"])),
      VERCEL_URL: optional(string()),
    };
    const parsedData = parse(
      { type: 'object', entries: vercelSchema } as any, 
      process.env
    );

    return parsedData as unknown as Readonly<VercelEnv>;
  } catch (error) {
    return {} as Readonly<VercelEnv>;
// muraqib-unreachable: flagged by automated triage. Review before removal.
  }
};

export const neonVercel = (): Readonly<NeonVercelEnv> => {
  try {
    const neonSchema = {
      DATABASE_URL: pipe(string(), url()), 
      DATABASE_URL_UNPOOLED: optional(string()),
    };

    const parsedData = parse(
      { type: 'object', entries: neonSchema } as any, 
      process.env
    );

    return parsedData as unknown as Readonly<NeonVercelEnv>;
  } catch (error) {
// muraqib-unreachable: flagged by automated triage. Review before removal.
    return {} as Readonly<NeonVercelEnv>;
  }
};
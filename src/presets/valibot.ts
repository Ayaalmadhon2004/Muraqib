import { optional, string, picklist, pipe, url, object, parse } from "valibot";
import type { VercelEnv, NeonVercelEnv } from "../presets.js";

export const vercel = (): Readonly<VercelEnv> => { // muraqib-ignore-dead: auto-suppressed by script for vercel
  try {
    const vercelSchema = {
      VERCEL: optional(string()),
      CI: optional(string()),
      VERCEL_ENV: optional(picklist(["development", "preview", "production"])),
      VERCEL_URL: optional(string()),
    };
    const parsedData = parse(object(vercelSchema), process.env);

    return parsedData as unknown as Readonly<VercelEnv>;
  } catch (error) {
    return {} as Readonly<VercelEnv>;
  }
};
 // muraqib-ignore-dead: auto-suppressed by script for neonVercel
export const neonVercel = (): Readonly<NeonVercelEnv> => {
  try {
    const neonSchema = {
      DATABASE_URL: pipe(string(), url()), 
      DATABASE_URL_UNPOOLED: optional(string()),
    };

    const parsedData = parse(object(neonSchema), process.env);

    return parsedData as unknown as Readonly<NeonVercelEnv>;
  } catch (error) {
    return {} as Readonly<NeonVercelEnv>;
  }
};
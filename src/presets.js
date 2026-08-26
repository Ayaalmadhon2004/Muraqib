// src/presets.ts
import { z } from "zod";
export const presetsMap = {
    vercel: {
        VERCEL: z.string().optional(),
        VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    },
    next: {
        NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    },
    neonVercel: {
        DATABASE_URL: z.string().url(),
    },
    supabaseVercel: {
        SUPABASE_URL: z.string().url(),
        SUPABASE_ANON_KEY: z.string(),
    },
    railway: {
        RAILWAY_ENVIRONMENT_NAME: z.string().optional(),
    }
};
//# sourceMappingURL=presets.js.map
// src/presets.ts
import { z } from "zod";

export interface VercelEnv {
  VERCEL?: string;
  CI?: string;
  VERCEL_ENV?: "development" | "preview" | "production";
  VERCEL_TARGET_ENV?: "development" | "preview" | "production" | (string & {});
  VERCEL_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_REGION?: string;
  VERCEL_DEPLOYMENT_ID?: string;
}

export interface NeonVercelEnv extends VercelEnv {
  DATABASE_URL: string;
  DATABASE_URL_UNPOOLED?: string;
  PGHOST?: string;
  PGHOST_UNPOOLED?: string;
}

export interface SupabaseVercelEnv extends VercelEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export interface RailwayEnv {
  RAILWAY_ENVIRONMENT_NAME?: string;
  RAILWAY_ENVIRONMENT_ID?: string;
  RAILWAY_PROJECT_NAME?: string;
  RAILWAY_PROJECT_ID?: string;
}

export type PresetInput = "vercel" | "neonVercel" | "supabaseVercel" | "railway" | "next"; // 👈 أضفنا "next" لتطابق كود التيست

export const presetsMap: Record<PresetInput, Record<string, any>> = {
  vercel: {
    VERCEL: z.string().optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  },
  next: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(), // 👈 حقن سكيما حقيقية لحل مشكلة الـ undefined في التيست الأول!
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
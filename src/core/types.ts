// src/core/types.ts
import { z } from "zod";

export type GuardSchema = Record<string, z.ZodTypeAny>;

export interface GuardOptions {
  runtimeEnv: Record<string, string | undefined>;
  isServer: boolean;
  emptyStringAsUndefined: boolean;
}
import { presetsMap } from "./presets.js";
import type { PresetInput } from "./presets.js"; 
import { createGuard } from "./guard/core/standard.js";
import type { GuardSchema } from "./guard/core/types.js";
import { z } from "zod";

export function createEnvWithPresets<T extends Record<string, z.ZodTypeAny>>(
  userSchema: T,
  options: {
    runtimeEnv: Record<string, any>;
    isServer?: boolean;
    emptyStringAsUndefined?: boolean;
    presets?: PresetInput[]; 
  }
) {
  let combinedSchema: Record<string, z.ZodTypeAny> = { ...userSchema };

  if (options.presets) {
    for (const preset of options.presets) {
      if (typeof preset === "string") {
        const presetSchema = presetsMap[preset];
        if (presetSchema) {
          combinedSchema = { ...combinedSchema, ...presetSchema };
        }
      } else if (preset && typeof preset === "object") {
        combinedSchema = { ...combinedSchema, ...preset };
      }
    }
  }

  return createGuard(combinedSchema, {
    runtimeEnv: options.runtimeEnv,
    isServer: options.isServer ?? typeof window === "undefined",
    emptyStringAsUndefined: options.emptyStringAsUndefined ?? true,
  });
}

// الدالة الثانية والمتقدمة: createEnv
interface CreateEnvOptions<
  TServer extends GuardSchema = Record<string, never>,
  TClient extends GuardSchema = Record<string, never>
> {
  server?: TServer;
  client?: TClient;
  presets?: PresetInput[];
  runtimeEnv: Record<string, any>;
  isServer?: boolean;
  emptyStringAsUndefined?: boolean;
}

export function createEnv<
  TServer extends GuardSchema = Record<string, never>,
  TClient extends GuardSchema = Record<string, never>
>(opts: CreateEnvOptions<TServer, TClient>) { 
  let combinedSchema: GuardSchema = {
    ...opts.server,
    ...opts.client,
  };

  if (opts.presets) {
    for (const preset of opts.presets) {
      if (typeof preset === "string") {
        const presetSchema = presetsMap[preset];
        if (presetSchema) {
          combinedSchema = { ...combinedSchema, ...presetSchema };
        }
      } else if (preset && typeof preset === "object") {
        combinedSchema = { ...combinedSchema, ...preset };
      }
    }
  }

  return createGuard(combinedSchema, { 
    runtimeEnv: opts.runtimeEnv,
    isServer: opts.isServer ?? typeof window === "undefined",
    emptyStringAsUndefined: opts.emptyStringAsUndefined ?? true,
  });
}
import type { BaseOptions, StrictOptions, Simplify } from "./types.js";

export function createGuard<T extends Record<string, any>>(
  schema: T,
  opts: BaseOptions & (
    | { runtimeEnv: Record<string, any>; runtimeEnvStrict?: never } 
    | { runtimeEnvStrict: Record<string, any>; runtimeEnv?: never } 
  )
) {
  const runtimeEnv = { ...(opts.runtimeEnv || (opts as any).runtimeEnvStrict) };
  if (opts.emptyStringAsUndefined) {
    for (const key in runtimeEnv) {
      if (runtimeEnv[key] === "") delete runtimeEnv[key]; 
    }
  }

  const validate = (s: any) => {
    const result = s["~standard"].validate(runtimeEnv);
    if (result instanceof Promise) {
      throw new Error("Muraqib: Validation must be synchronous!");
    }
    return result;
  };

  const parsed = validate(schema);

  if (parsed.issues) {
    const defaultError = (issues: any) => {
      console.error("❌ Muraqib Validation Error:", JSON.stringify(issues, null, 2));
      throw new Error("Invalid environment variables");
    };
    return (opts.onValidationError || defaultError)(parsed.issues);
  }

  return new Proxy(parsed.value, { 
    get(target, prop: string) {
      const isClient = !opts.isServer;
      const isSecret = !prop.startsWith("NEXT_PUBLIC_");

      if (isClient && isSecret) {
        const defaultAccessError = (variable: string) => {
          throw new Error(`🚫 Muraqib: Cannot access server-side variable "${variable}" on the client!`);
        };
        return (opts.onInvalidAccess || defaultAccessError)(prop);
      }
      return Reflect.get(target, prop);
    }
  }) as Simplify<T>;
}
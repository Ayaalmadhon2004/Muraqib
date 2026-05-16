import type { StandardSchemaV1 } from "@standard-schema/spec";

export type Simplify<T> = { [K in keyof T]: T[K] } & {};
export type Impossible<T> = { [K in keyof T]: never };
export type Reduce<T extends any[]> = T extends [infer Head, ...infer Tail]
  ? Simplify<Head & Reduce<Tail>>
  : {};

export interface BaseOptions {
    isServer?: boolean;
    onValidationError?: (issues: readonly StandardSchemaV1.Issue[]) => never;
    onInvalidAccess?: (variable: string) => never;
    emptyStringAsUndefined?: boolean;
    skipValidation?: boolean;
}

export interface StrictOptions {
    runtimeEnvStrict: Record<string, string | boolean | number | undefined>;
    runtimeEnv?: never;
}
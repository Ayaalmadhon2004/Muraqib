import { z } from "zod";
import type { PresetInput } from "./presets.js";
import type { GuardSchema } from "./core/types.js";
export interface LoadEnvOptions {
    /** مسار المجلد اللي بدّك تدور فيه على .env (default: process.cwd()) */
    cwd?: string;
    /** قائمة بأسماء ملفات .env بدّك تحمّلها بالترتيب (default: ['.env', '.env.${NODE_ENV}', '.env.local']) */
    files?: string[];
    /** إذا true، ما بتغيّر process.env (default: false) */
    preserveProcessEnv?: boolean;
    /** إذا true، بتطبّع log لكل ملف محمّل (default: false) */
    verbose?: boolean;
}
/**
 * 🌟 محمّل .env متقدم — يدعم:
 *   • inline comments:  KEY=value # هذا تعليق
 *   • multiline values:  KEY="line1\nline2"  أو  KEY=line1\nline2
 *   • variable expansion: DATABASE_URL=$BASE_URL/db
 *   • quotes handling:   KEY='value' أو KEY="value"
 */
export declare function loadEnv(options?: LoadEnvOptions): Record<string, string>;
export type InferSchema<T extends GuardSchema> = {
    [K in keyof T]: T[K] extends {
        ["~standard"]: {
            types: {
                output: infer O;
            };
        };
    } ? O : T[K] extends {
        _output: infer O;
    } ? O : T[K] extends {
        infer: infer O;
    } ? O : any;
};
export type IntersectExtension<T extends any[]> = T extends [infer Head, ...infer Tail] ? Head extends Record<string, any> ? Head & IntersectExtension<Tail> : IntersectExtension<Tail> : unknown;
export type ErrorMessage<T extends string> = T & {
    __brand: "ErrorMessage";
};
export interface CreateEnvOptions<TPrefix extends string = "", TServer extends GuardSchema = Record<string, never>, TClient extends GuardSchema = Record<string, never>, TExtends extends any[] = []> {
    clientPrefix?: TPrefix;
    server?: {
        [K in keyof TServer]: K extends `${TPrefix}${string}` ? ErrorMessage<`❌ خطأ مالي: المتغير "${K & string}" يحمل البادئة المخصصة للعميل، يرجى نقله إلى كائن الـ client.`> : TServer[K];
    };
    client?: {
        [K in keyof TClient]: K extends `${TPrefix}${string}` ? TClient[K] : ErrorMessage<`❌ خطأ أمني: المتغير "${K & string}" لا يحمل البادئة الآمنة "${TPrefix}"، يرجى نقله للسيرفر.`>;
    };
    runtimeEnvStrict?: Record<string, unknown>;
    runtimeEnv?: Record<string, string | undefined>;
    extends?: TExtends;
    emptyStringAsUndefined?: boolean;
    isServer?: boolean;
    schedule?: string;
    /** إذا true، ما بيفحصش الـ env (مفيد في CI/build) */
    skipValidation?: boolean;
    /** إذا true، بيخفي كل console logs */
    silent?: boolean;
    /** callback مخصص لتنسيق الـ error messages */
    formatError?: (issues: Array<{
        path: string;
        message: string;
    }>) => string;
    /** مسار ملف .env مخصص (أو array) */
    envFilePath?: string | string[];
    /** إذا true، ما بيغيّرش process.env */
    preserveProcessEnv?: boolean;
}
export declare function createEnv<TPrefix extends string = "", TServer extends GuardSchema = Record<string, never>, TClient extends GuardSchema = Record<string, never>, TExtends extends any[] = []>(opts: CreateEnvOptions<TPrefix, TServer, TClient, TExtends>): (InferSchema<TServer> & InferSchema<TClient> & IntersectExtension<TExtends>) | null;
export declare function safeCreateEnv<TPrefix extends string = "", TServer extends GuardSchema = Record<string, never>, TClient extends GuardSchema = Record<string, never>, TExtends extends any[] = []>(opts: CreateEnvOptions<TPrefix, TServer, TClient, TExtends>): {
    success: true;
    data: InferSchema<TServer> & InferSchema<TClient> & IntersectExtension<TExtends>;
} | {
    success: false;
    error: {
        path: string;
        message: string;
    }[];
};
export declare function createEnvWithPresets<T extends Record<string, z.ZodTypeAny>>(userSchema: T, options: {
    runtimeEnv: Record<string, any>;
    isServer?: boolean;
    emptyStringAsUndefined?: boolean;
    presets?: PresetInput[];
    schedule?: string;
    skipValidation?: boolean;
    silent?: boolean;
    formatError?: (issues: Array<{
        path: string;
        message: string;
    }>) => string;
    envFilePath?: string | string[];
    preserveProcessEnv?: boolean;
}): z.infer<z.ZodObject<T>> | null;
//# sourceMappingURL=env.d.ts.map
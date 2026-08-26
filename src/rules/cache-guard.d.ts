import { z } from "zod";
export declare const cachePerformanceSchema: {
    STATIC_ASSETS_CACHE_MAX_AGE: z.ZodPipe<z.ZodUnion<[z.ZodString, z.ZodNumber]>, z.ZodTransform<number, string | number>>;
    ENABLE_SERVER_COMPRESSION: z.ZodPipe<z.ZodUnion<[z.ZodString, z.ZodBoolean]>, z.ZodTransform<boolean, string | boolean>>;
};
export declare const runtimeCacheSchema: z.ZodObject<{
    ENABLE_SERVER_COMPRESSION: z.ZodPipe<z.ZodString, z.ZodTransform<boolean, string>>;
    STATIC_ASSETS_CACHE_MAX_AGE: z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>;
}, z.core.$strip>;
//# sourceMappingURL=cache-guard.d.ts.map
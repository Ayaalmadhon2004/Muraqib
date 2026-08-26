// src/core/standard.ts
import { z } from "zod";
export function createGuard(schema, options) {
    // هنا نقوم بدمج المتغيرات مع المخطط (Zod Schema)
    const result = schema.safeParse(options.runtimeEnv);
    if (!result.success) {
        // إلقاء الخطأ بنفس النمط الذي يتوقعه المحرك
        throw {
            message: "Validation Failed",
            errors: result.error.issues,
        };
    }
    return { data: result.data };
}
//# sourceMappingURL=standard.js.map
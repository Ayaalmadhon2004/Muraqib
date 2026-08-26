import * as z from "zod";
import { createEnv } from "../index.js";
/**
 * 🌐 Vercel Environment Parser
 * فحص وتدقيق المتغيرات التي تحقنها منصة Vercel تلقائياً
 */
export const vercel = () => {
    // 1️⃣ نقوم ببناء سكيمة التحقق الصافية من Zod وتمرير البيئة لها مباشرة
    const vercelSchema = z.object({
        VERCEL: z.string().optional(),
        CI: z.string().optional(),
        VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
        VERCEL_URL: z.string().optional(),
    });
    // 2️⃣ استخراج البيانات المفحوصة بأمان
    const parsed = vercelSchema.safeParse(process.env);
    const validatedEnv = parsed.success ? parsed.data : {};
    // 3️⃣ تمرير البيانات النظيفة إلى دالة createEnv الداخلية لتسجيلها في السيستم دون تعارض أنواع
    const env = createEnv({
        server: validatedEnv,
        runtimeEnv: process.env,
    });
    return (env ?? {});
};
/**
 * 🐘 Neon Vercel Database Environment Parser
 * فحص وتدقيق متغيرات الاتصال بقاعدة البيانات وسلسلة الـ Connection Strings
 */
export const neonVercel = () => {
    const neonSchema = z.object({
        DATABASE_URL: z.string().url(),
        DATABASE_URL_UNPOOLED: z.string().optional(),
    });
    const parsed = neonSchema.safeParse(process.env);
    const validatedEnv = parsed.success ? parsed.data : {};
    const env = createEnv({
        server: validatedEnv,
        runtimeEnv: process.env,
    });
    return (env ?? {});
};
//# sourceMappingURL=zod.js.map
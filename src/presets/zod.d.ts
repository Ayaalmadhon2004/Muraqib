import type { VercelEnv, NeonVercelEnv } from "../presets.js";
/**
 * 🌐 Vercel Environment Parser
 * فحص وتدقيق المتغيرات التي تحقنها منصة Vercel تلقائياً
 */
export declare const vercel: () => Readonly<VercelEnv>;
/**
 * 🐘 Neon Vercel Database Environment Parser
 * فحص وتدقيق متغيرات الاتصال بقاعدة البيانات وسلسلة الـ Connection Strings
 */
export declare const neonVercel: () => Readonly<NeonVercelEnv>;
//# sourceMappingURL=zod.d.ts.map
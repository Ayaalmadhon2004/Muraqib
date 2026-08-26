import { z } from "zod";
import type { GuardOptions } from "./types.js";
export declare function createGuard<T extends z.ZodRawShape>(schema: z.ZodObject<T>, options: GuardOptions): {
    data: z.core.$InferObjectOutput<T, {}>;
};
//# sourceMappingURL=standard.d.ts.map
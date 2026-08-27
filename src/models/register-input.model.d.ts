import { z } from "zod";
export declare const registerInputSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
//# sourceMappingURL=register-input.model.d.ts.map
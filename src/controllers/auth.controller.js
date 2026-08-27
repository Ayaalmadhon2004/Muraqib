import { AuthService } from "../services/auth.service.js";
import { PrismaUserRepository } from "../repositories/prisma-user.repository.js";
import { registerInputSchema } from "../models/register-input.model.js";
export const AuthController = {
    async handleRegister(req, res, next) {
        try {
            const validatedData = registerInputSchema.parse(req.body);
            const svc = new AuthService(new PrismaUserRepository());
            const result = await svc.register(validatedData);
            return res.status(201).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                return res.status(400).json({ success: false, errors: error.errors });
            }
            next(error);
        }
    }
};
//# sourceMappingURL=auth.controller.js.map
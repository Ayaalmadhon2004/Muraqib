import type { Request, Response, NextFunction } from "express"; 
import { AuthService } from "../services/auth.service.js";
import { PrismaUserRepository } from "../repositories/prisma-user.repository.js";
import { registerInputSchema } from "../models/register-input.model.js";

export const AuthController = { // muraqib-ignore-dead: auto-suppressed by script for AuthController
  async handleRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerInputSchema.parse(req.body); 
      const svc = new AuthService(new PrismaUserRepository());
      const result = await svc.register(validatedData);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
// muraqib-unreachable: flagged by automated triage. Review before removal.
      }
      next(error);
    }
  }
};
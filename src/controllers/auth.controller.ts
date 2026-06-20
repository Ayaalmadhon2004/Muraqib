import { Request, Response, NextFunction } from "express"; 
import { AuthService } from "../services/auth.service.js";
import { registerInputSchema } from "../models/register-input.model.js";

export const AuthController = {
  async handleRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerInputSchema.parse(req.body); 
      const result = await AuthService.register(validatedData);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      next(error);
    }
  }
};
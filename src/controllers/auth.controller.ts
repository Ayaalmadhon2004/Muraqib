// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { registerInputSchema } from "../models/register-input.model.js";

export const AuthController = {
  async handleRegister(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. التحقق من المدخلات باستخدام Zod
      const validatedData = registerInputSchema.parse(req.body);
      
      // 2. استدعاء الخدمة
      const result = await AuthService.register(validatedData);
      
      // 3. إرجاع الرد الناجح
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      // 4. معالجة الأخطاء مركزياً
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors });
      }
      next(error);
    }
  }
};
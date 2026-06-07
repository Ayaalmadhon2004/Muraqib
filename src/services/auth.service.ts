// src/services/auth.service.ts
import { z } from "zod";
import { registerInputSchema } from "../models/register-input.model.js";

export const AuthService = {
  async register(data: z.infer<typeof registerInputSchema>) {
    console.log(`👤 [AuthService]: Registering user: ${data.email}`);
    
    return { success: true, message: "User registered successfully" };
  }
};
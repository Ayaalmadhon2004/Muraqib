// src/models/user.model.ts
export interface User {
  id: string;
  email: string;
  passwordHash: string; // لا تخزني كلمة السر الصريحة أبداً!
  fullName: string;
  isActive: boolean;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}
// src/models/user.model.ts
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
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
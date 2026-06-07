// src/services/auth.service.ts
import prisma from '../lib/prisma.js';
import HttpException from '../models/http-exception.model.js';
import { RegisterInput } from '../models/register-input.model.js';
import * as bcrypt from 'bcryptjs';

export const createUser = async (input: RegisterInput) => {
  const hashedPassword = await bcrypt.hash(input.password, 10);
  
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        password: hashedPassword,
      },
    });
    return user;
  } catch (error) {
    throw new HttpException(422, { errors: { email: ['could not create user'] } });
  }
};
import * as bcrypt from 'bcryptjs';
import { RegisterInput } from '../models/register-input.model.js';
import { UserRepository } from '../repositories/user.repository.js';
import HttpException from '../models/http-exception.model.js';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async register(input: RegisterInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    
    try {
      const user = await this.userRepository.create({
        ...input,
        password: hashedPassword,
      });
      return user;
    } catch (error) {
      throw new HttpException(422, { errors: { email: ['could not create user'] } });
    }
  }
}
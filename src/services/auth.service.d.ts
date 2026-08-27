import { RegisterInput } from '../models/register-input.model.js';
import { UserRepository } from '../repositories/user.repository.js';
export declare class AuthService {
    private userRepository;
    constructor(userRepository: UserRepository);
    register(input: RegisterInput): Promise<User>;
}
//# sourceMappingURL=auth.service.d.ts.map
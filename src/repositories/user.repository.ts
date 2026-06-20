export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: UserInput): Promise<User>;
}

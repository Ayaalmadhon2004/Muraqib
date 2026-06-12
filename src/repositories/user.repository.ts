export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: UserInput): Promise<User>;
}
//why i put these 3 lines in seperate file 
export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string) { return prisma.user.findUnique({ where: { email } }); }
  async create(data: UserInput) { return prisma.user.create({ data }); }
}

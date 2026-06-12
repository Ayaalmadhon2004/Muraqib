export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string) { return prisma.user.findUnique({ where: { email } }); }
  async create(data: UserInput) { return prisma.user.create({ data }); }
}
//we said that we will make an abstract idea because not all programmers use prisma , ok ?

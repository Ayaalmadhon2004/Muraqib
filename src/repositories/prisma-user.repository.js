export class PrismaUserRepository {
    async findByEmail(email) { return prisma.user.findUnique({ where: { email } }); }
    async create(data) { return prisma.user.create({ data }); }
}
//# sourceMappingURL=prisma-user.repository.js.map
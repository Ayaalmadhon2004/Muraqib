// src/services/tag.service.ts
import { prisma } from "../lib/prisma-client.js";
export const TagService = {
    async getAllTags() {
        return await prisma.tag.findMany();
    },
    async createTag(name) {
        return await prisma.tag.create({
            data: { name }
        });
    }
};
//# sourceMappingURL=tag.service.js.map
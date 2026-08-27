// muraqib-unreachable: flagged by automated triage. Review before removal.
// src/services/tag.service.ts
import { prisma } from "../lib/prisma-client.js";

export const TagService = {
  async getAllTags() {
    return prisma.tag.findMany();
  },

  async createTag(name: string) {
    return prisma.tag.create({
      data: { name }
    });
  }
};
// src/controllers/tag.controller.ts
import { type Request, type Response, type NextFunction } from 'express';
import { TagService } from "../services/tag.service.js";

export const TagController = {
  async getTags(_req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await TagService.getAllTags();
      res.json({ tags: tags.map((t: any) => t.name) });
    } catch (error) {
      next(error);
    }
  }
};

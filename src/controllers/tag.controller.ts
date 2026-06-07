// src/controllers/tag.controller.ts
import { Request, Response, NextFunction } from "express";
import { TagService } from "../services/tag.service.js";

export const TagController = {
  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await TagService.getAllTags();
      res.json({ tags: tags.map(t => t.name) });
    } catch (error) {
      next(error);
    }
  }
};
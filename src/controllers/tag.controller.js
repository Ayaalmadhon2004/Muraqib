// src/controllers/tag.controller.ts
import {} from 'express';
import { TagService } from "../services/tag.service.js";
export const TagController = {
    async getTags(_req, res, next) {
        try {
            const tags = await TagService.getAllTags();
            res.json({ tags: tags.map((t) => t.name) });
        }
        catch (error) {
            next(error);
        }
    }
};
//# sourceMappingURL=tag.controller.js.map
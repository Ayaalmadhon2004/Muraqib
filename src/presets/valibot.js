import { optional, string, picklist, pipe, url, parse } from "valibot";
export const vercel = () => {
    try {
        const vercelSchema = {
            VERCEL: optional(string()),
            CI: optional(string()),
            VERCEL_ENV: optional(picklist(["development", "preview", "production"])),
            VERCEL_URL: optional(string()),
        };
        const parsedData = parse({ type: 'object', entries: vercelSchema }, process.env);
        return parsedData;
    }
    catch (error) {
        return {};
    }
};
export const neonVercel = () => {
    try {
        const neonSchema = {
            DATABASE_URL: pipe(string(), url()),
            DATABASE_URL_UNPOOLED: optional(string()),
        };
        const parsedData = parse({ type: 'object', entries: neonSchema }, process.env);
        return parsedData;
    }
    catch (error) {
        return {};
    }
};
//# sourceMappingURL=valibot.js.map
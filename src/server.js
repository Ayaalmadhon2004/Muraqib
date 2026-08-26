import express from "express";
import compression from "compression";
import path from "path";
import fs from "fs";
import { performanceMonitor } from "./middleware/performance.middleware.js";
import { applySecurityMiddleware } from "./middleware/security.middleware.js";
// Ensure reasonable defaults for development so audits can run without a local .env
process.env.PORT = process.env.PORT || "3000";
process.env.STATIC_ASSETS_CACHE_MAX_AGE = process.env.STATIC_ASSETS_CACHE_MAX_AGE || "86400"; // seconds
process.env.ENABLE_SERVER_COMPRESSION = process.env.ENABLE_SERVER_COMPRESSION || "true";
const app = express();
app.use(express.json());
// Compression
if (process.env.ENABLE_SERVER_COMPRESSION === "true") {
    app.use(compression());
}
// Security middleware (helmet + headers)
applySecurityMiddleware(app);
// Performance monitor
app.use(performanceMonitor);
// Serve static files from public/ with configured cache control
const publicDir = path.join(process.cwd(), "public");
const cacheSeconds = Number(process.env.STATIC_ASSETS_CACHE_MAX_AGE) || 86400;
app.use(express.static(publicDir, { maxAge: cacheSeconds * 1000 }));
// Basic health route
app.get("/", (req, res) => {
    const indexPath = path.join(publicDir, "index.html");
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    return res.json({ status: "ok", message: "Muraqib server running" });
});
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`[Muraqib Server] Listening on http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map
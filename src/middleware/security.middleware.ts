import type { Express } from "express";
import helmet from "helmet";

export function applySecurityMiddleware(app: Express) {
  // Use helmet defaults, enable several useful protections
  app.use(
    helmet({
      contentSecurityPolicy: false, // leave CSP opt-in because apps differ widely
    })
  );

  // Provide a minimal recommended CSP header example (optional)
  app.use((req, res, next) => {
    if (!res.getHeader("Content-Security-Policy")) {
      // Example CSP — adapt for your app's asset hosting and inline scripts if necessary
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'"
      );
    }

    // Permissions-Policy (formerly Feature-Policy)
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    // Encourage cross-origin isolation when appropriate
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

    next();
  });
}

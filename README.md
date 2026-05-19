# Muraqib
### 🚀 Advanced Usage: Custom Schemas
If you are using a provider that is not built-in (like Firebase), you can easily extend Muraqib by passing a custom schema object straight into the `presets` array:

```typescript
import { createEnvWithPresets } from "muraqib";
import { z } from "zod";

const firebaseCustomSchema = {
  FIREBASE_API_KEY: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string(),
};

export const env = createEnvWithPresets(
  { DATABASE_URL: z.string().url() },
  {
    runtimeEnv: process.env,
    presets: ["vercel", firebaseCustomSchema], // Combined built-in + custom!
  }
);
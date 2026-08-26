declare module "@prisma/client" {
  export class PrismaClient {
    [key: string]: any;
  }
}

declare module "compression" {
  const compression: (options?: unknown) => any;
  export default compression;
}

declare module "vitest/config" {
  export function defineConfig(config: unknown): unknown;
}

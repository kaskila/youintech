import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI only — migrations. MUST be the UNPOOLED Neon string.
    // Migrations through PgBouncer hang rather than fail cleanly.
    url: env("DIRECT_URL"),
  },
});
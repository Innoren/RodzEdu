import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Falls back to a local SQLite file so the CLI works with zero config.
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});

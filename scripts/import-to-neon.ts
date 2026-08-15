/**
 * One-shot: import local data/store.json (or seed) into Neon.
 * Usage: npx tsx scripts/import-to-neon.ts
 */
import { config } from "dotenv";
import { promises as fs } from "fs";
import path from "path";

config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing in .env.local");
  }

  const { normalizeDatabase } = await import("../src/lib/normalize");
  const { seedData } = await import("../src/lib/seed");
  const { saveDatabaseToNeon, loadDatabaseFromNeon, ensureNeonSchema } =
    await import("../src/lib/neonStore");

  await ensureNeonSchema();

  const existing = await loadDatabaseFromNeon();
  if (existing && existing.users.length > 0) {
    console.log(
      `Neon already has ${existing.users.length} users and ${existing.courses.length} courses. Skipping import.`,
    );
    return;
  }

  const storePath = path.join(process.cwd(), "data", "store.json");
  let raw: unknown = seedData;
  try {
    const text = await fs.readFile(storePath, "utf8");
    raw = JSON.parse(text);
    console.log(`Loaded ${storePath}`);
  } catch {
    console.log("No local store.json — importing seed data.");
  }

  const db = normalizeDatabase(structuredClone(raw));
  await saveDatabaseToNeon(db);

  const verify = await loadDatabaseFromNeon();
  console.log(
    `Imported to Neon: ${verify?.users.length ?? 0} users, ${verify?.courses.length ?? 0} courses, ${verify?.enrollments.length ?? 0} enrollments.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

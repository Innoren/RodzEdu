import { readFileSync, existsSync } from "fs";
import path from "path";

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }

  const { resetAllStudentProgress } = await import("../src/lib/db");
  const result = await resetAllStudentProgress();
  console.log(
    `Reset complete: ${result.enrollmentsReset} enrollments, ${result.certificatesRemoved} certificates removed.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

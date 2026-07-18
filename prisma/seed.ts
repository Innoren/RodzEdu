import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

// The catalog intentionally starts empty — no courses are seeded.
// Only two demo login accounts are created so you can sign in immediately:
// instructors publish their own courses from the studio.
async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "teacher@rodzedu.com" },
    update: {},
    create: {
      name: "Dr. Rita Rodriguez",
      email: "teacher@rodzedu.com",
      passwordHash: password,
      role: "TEACHER",
    },
  });

  await prisma.user.upsert({
    where: { email: "student@rodzedu.com" },
    update: {},
    create: {
      name: "Sam Student",
      email: "student@rodzedu.com",
      passwordHash: password,
      role: "STUDENT",
    },
  });

  console.log("Seeded demo accounts (no courses):");
  console.log("  Teacher  -> teacher@rodzedu.com / password123");
  console.log("  Student  -> student@rodzedu.com / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

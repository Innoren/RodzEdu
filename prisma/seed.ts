import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const teacher = await prisma.user.upsert({
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

  const courses = [
    {
      slug: "mammography-positioning-essentials",
      title: "Mammography Positioning Essentials",
      category: "Mammography",
      summary:
        "Master craniocaudal and mediolateral oblique positioning for high-quality mammograms.",
      description:
        "This course reviews the fundamentals of mammographic positioning, image evaluation criteria, and common pitfalls. Designed for technologists seeking ARRT Category A credits, it covers CC and MLO views, compression technique, and quality assurance.",
      priceCents: 4900,
      credits: 3,
      lessons: [
        {
          title: "Introduction to Mammographic Positioning",
          content:
            "Positioning is the single most important factor in producing diagnostic-quality mammograms. In this lesson we introduce the coordinate system used to describe breast positioning and the key anatomical landmarks (nipple in profile, pectoral muscle, inframammary fold) you must capture.",
        },
        {
          title: "The Craniocaudal (CC) View",
          content:
            "The CC view images the breast from above. Proper technique maximizes posterior tissue inclusion while keeping the nipple in profile. We review compression, patient communication, and evaluation criteria such as the posterior nipple line measurement.",
        },
        {
          title: "The Mediolateral Oblique (MLO) View",
          content:
            "The MLO is the most important single projection because it images the greatest amount of breast tissue. This lesson details the 45-degree detector angle, pectoral muscle to nipple line, and how to avoid skin folds.",
        },
      ],
    },
    {
      slug: "ct-cross-sectional-anatomy",
      title: "CT Cross-Sectional Anatomy",
      category: "CT",
      summary:
        "Build confidence reading axial, coronal, and sagittal CT anatomy of the chest, abdomen, and pelvis.",
      description:
        "A practical review of cross-sectional anatomy for CT technologists. Learn to identify key structures across planes, understand windowing, and correlate anatomy with common protocols.",
      priceCents: 5900,
      credits: 4,
      lessons: [
        {
          title: "Principles of Cross-Sectional Imaging",
          content:
            "Understand how CT reconstructs volumetric data into axial slices and how multiplanar reformats are generated. We cover Hounsfield units, window width, and window level.",
        },
        {
          title: "Thoracic Anatomy",
          content:
            "Identify the mediastinal structures, great vessels, and lung segments on axial CT. We highlight the aortic arch, pulmonary trunk, and carina as key landmarks.",
        },
      ],
    },
    {
      slug: "mri-safety-essentials",
      title: "MRI Safety Essentials",
      category: "MRI",
      summary:
        "Everything a technologist needs to keep patients and staff safe in the MR environment.",
      description:
        "Covers the four MR safety zones, ferromagnetic screening, implant safety, RF heating, acoustic noise, and emergency procedures including quenching. Aligned to ACR guidance.",
      priceCents: 3900,
      credits: 2,
      lessons: [
        {
          title: "The Four MR Safety Zones",
          content:
            "Zones I–IV define escalating levels of access control around the magnet. This lesson explains who may enter each zone and how screening prevents ferromagnetic projectiles.",
        },
        {
          title: "Screening and Implants",
          content:
            "Learn a systematic approach to patient and personnel screening, MR Conditional vs MR Safe labeling, and how to verify implant compatibility before scanning.",
        },
      ],
    },
    {
      slug: "radiation-protection-fundamentals",
      title: "Radiation Protection Fundamentals",
      category: "Safety",
      summary:
        "ALARA, time-distance-shielding, and dose optimization for every imaging professional.",
      description:
        "A foundational course on radiation protection principles for radiographers. Understand dose quantities, the ALARA principle, occupational limits, and practical dose-reduction techniques.",
      priceCents: 0,
      credits: 1,
      lessons: [
        {
          title: "The ALARA Principle",
          content:
            "ALARA — As Low As Reasonably Achievable — guides all radiation protection. We break down the three cardinal rules: minimize time, maximize distance, and use shielding.",
        },
        {
          title: "Occupational Dose Limits",
          content:
            "Review annual effective dose limits for radiation workers, monitoring with dosimeters, and the declared-pregnancy provisions that protect the embryo/fetus.",
        },
      ],
    },
  ];

  for (const c of courses) {
    const { lessons, ...courseData } = c;
    const created = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        ...courseData,
        published: true,
        instructorId: teacher.id,
        lessons: {
          create: lessons.map((l, order) => ({ ...l, order })),
        },
      },
    });
    console.log(`Seeded course: ${created.title}`);
  }

  console.log("\nDemo accounts:");
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

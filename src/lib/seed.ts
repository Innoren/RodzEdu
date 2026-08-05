import type { Course, Database } from "./types";

function withModules(
  course: Omit<Course, "modules" | "featured"> & {
    modules?: Course["modules"];
    featured?: boolean;
  },
): Course {
  const base = { ...course, featured: Boolean(course.featured) };
  if (course.modules?.length) return { ...base, modules: course.modules } as Course;
  return {
    ...base,
    modules: [
      {
        id: `${course.id}-mod-1`,
        title: "Module 1 — Foundations",
        content: course.content,
        quizQuestions: [
          {
            id: `${course.id}-mq1`,
            prompt: `In ${course.title}, what is the first step toward earning CE credit?`,
            choices: [
              "Complete the learning modules, then take the final exam",
              "Skip modules and request a certificate",
              "Only watch a video once",
              "Mail a paper workbook",
            ],
            correctIndex: 0,
          },
        ],
      },
      {
        id: `${course.id}-mod-2`,
        title: "Module 2 — Practice & review",
        content: `${course.content}\n\nReview key takeaways, relate them to your clinical workflow, and confirm you are ready for the final exam.`,
        quizQuestions: [
          {
            id: `${course.id}-mq2`,
            prompt: "Progress is saved so you can:",
            choices: [
              "Return later and continue where you left off",
              "Only study in one sitting",
              "Share your login with coworkers",
              "Skip the final exam",
            ],
            correctIndex: 0,
          },
        ],
      },
    ],
  };
}

export const seedData: Database = {
  settings: {
    companyName: "RodzEdu",
    tagline:
      "Continuing education imaging professionals can trust — clear courses, credible credits, real support.",
    phone: "",
    email: "ce@rodzedu.com",
    address: "6511 Glenridge Park Place, Louisville, KY 40222",
    announcement:
      "Radiology CE now open for enrollment — Category A credits accepted for ARRT® certification & registration.",
  },
  users: [
    {
      id: "user-ceo",
      email: "ceo@rodzedu.com",
      password: "ceo123",
      name: "Pedro Rodriguez",
      role: "ceo",
    },
    {
      id: "user-admin",
      email: "admin@rodzedu.com",
      password: "admin123",
      name: "Jordan Blake",
      role: "admin",
    },
    {
      id: "user-teacher",
      email: "teacher@rodzedu.com",
      password: "teacher123",
      name: "Pedro Rodriguez",
      role: "teacher",
      credentials: "BSRS, RT(R)(CT)(MR)",
      bio: "Registered radiologic technologist with clinical experience in MRI, CT, and diagnostic radiography. Founder and lead instructor of RodzEdu, focused on practical, evidence-based continuing education for imaging professionals.",
    },
    {
      id: "user-student-1",
      email: "student@rodzedu.com",
      password: "student123",
      name: "Sam Rivera",
      role: "student",
      teacherId: "user-teacher",
    },
    {
      id: "user-student-2",
      email: "jamie@rodzedu.com",
      password: "student123",
      name: "Jamie Chen",
      role: "student",
      teacherId: "user-teacher",
    },
  ],
  courses: [
    withModules({
      id: "course-rad-fundamentals",
      title: "Radiographic Fundamentals Review",
      slug: "radiographic-fundamentals-review",
      category: "Radiography",
      credits: 4,
      priceCents: 4900,
      description:
        "A focused review of radiographic technique, patient positioning, and image quality essentials for practicing technologists.",
      published: true,
      featured: true,
      content:
        "This course covers exposure factors, contrast and density relationships, grids, collimation, and common positioning series. Complete all modules, then take the online exam to earn your CE certificate.",
      instructorId: "user-teacher",
      examQuestions: [
        {
          id: "q1",
          prompt: "Increasing kVp primarily affects which image quality factor?",
          choices: ["Spatial resolution", "Subject contrast", "Motion blur", "Focal spot size"],
          correctIndex: 1,
        },
        {
          id: "q2",
          prompt: "Collimation is used to:",
          choices: [
            "Increase patient dose",
            "Reduce scatter and improve contrast",
            "Increase focal spot blur",
            "Eliminate the need for grids",
          ],
          correctIndex: 1,
        },
        {
          id: "q3",
          prompt: "A grid is most useful when:",
          choices: [
            "Imaging extremities with low kVp",
            "Scatter production is high",
            "Using digital receptors only",
            "Patient motion is present",
          ],
          correctIndex: 1,
        },
        {
          id: "q4",
          prompt: "Proper centering and SID help control:",
          choices: [
            "Shape distortion and magnification",
            "Quantum mottle only",
            "Tube heat units",
            "Detector bit depth",
          ],
          correctIndex: 0,
        },
      ],
      createdAt: "2026-01-10T12:00:00.000Z",
      updatedAt: "2026-01-10T12:00:00.000Z",
    }),
    withModules({
      id: "course-mammo-basics",
      title: "Mammography Essentials",
      slug: "mammography-essentials",
      category: "Mammography",
      credits: 6,
      priceCents: 6900,
      description:
        "Core mammography imaging principles, quality control concepts, and patient care considerations for CE credit.",
      published: true,
      featured: true,
      content:
        "Explore breast anatomy for imaging, standard projections, compression technique, and quality assurance workflows used in mammography departments.",
      instructorId: "user-teacher",
      examQuestions: [
        {
          id: "q1",
          prompt: "Adequate breast compression is important because it:",
          choices: [
            "Increases geometric unsharpness",
            "Improves sharpness and reduces dose",
            "Eliminates the need for QC",
            "Increases scatter production",
          ],
          correctIndex: 1,
        },
        {
          id: "q2",
          prompt: "CC and MLO are:",
          choices: [
            "Ultrasound views",
            "Standard mammography projections",
            "MRI sequences",
            "Fluoroscopy modes",
          ],
          correctIndex: 1,
        },
        {
          id: "q3",
          prompt: "A primary goal of mammography QC is to:",
          choices: [
            "Skip annual physicist surveys",
            "Maintain consistent image quality and equipment performance",
            "Reduce staffing needs",
            "Replace continuing education",
          ],
          correctIndex: 1,
        },
      ],
      createdAt: "2026-02-01T12:00:00.000Z",
      updatedAt: "2026-02-01T12:00:00.000Z",
    }),
    withModules({
      id: "course-ct-safety",
      title: "CT Dose & Patient Safety",
      slug: "ct-dose-patient-safety",
      category: "Computed Tomography",
      credits: 3,
      priceCents: 3900,
      description:
        "Practical CT dose optimization strategies and patient safety practices for CT technologists.",
      published: true,
      featured: false,
      content:
        "Review ALARA principles in CT, automatic exposure control, pediatric considerations, and communication strategies that support safer imaging.",
      instructorId: "user-teacher",
      examQuestions: [
        {
          id: "q1",
          prompt: "ALARA stands for:",
          choices: [
            "As Low As Reasonably Achievable",
            "Average Level And Radiation Allowance",
            "Automated Low Area Risk Assessment",
            "Applied Linear Attenuation Rating Average",
          ],
          correctIndex: 0,
        },
        {
          id: "q2",
          prompt: "Automatic exposure control in CT is used to:",
          choices: [
            "Increase tube heat capacity",
            "Modulate tube current for patient size and anatomy",
            "Replace contrast media",
            "Eliminate the need for protocols",
          ],
          correctIndex: 1,
        },
        {
          id: "q3",
          prompt: "Pediatric CT protocols typically emphasize:",
          choices: [
            "Higher kVp only",
            "Dose reduction tailored to smaller patients",
            "Longer scan lengths",
            "Removing shielding policies",
          ],
          correctIndex: 1,
        },
      ],
      createdAt: "2026-03-01T12:00:00.000Z",
      updatedAt: "2026-03-01T12:00:00.000Z",
    }),
    {
      id: "course-mri-safety",
      title: "MRI Safety Essentials",
      slug: "mri-safety-essentials",
      category: "MRI",
      credits: 2,
      priceCents: 2900,
      description:
        "A practical introduction to MRI safety zones, screening, projectile risk, and implant considerations for imaging professionals.",
      published: true,
      featured: true,
      content:
        "MRI safety is a professional responsibility. This example course walks through zone control, patient screening, and day-to-day decisions that protect patients and staff.",
      instructorId: "user-teacher",
      modules: [
        {
          id: "course-mri-safety-mod-1",
          title: "Module 1 — Zones, access, and the static field",
          content: `MRI environments are organized into safety zones that control who can enter and what objects are allowed.

Zone I is publicly accessible. Zone II is the interface where screening begins. Zone III is restricted because of the magnetic field. Zone IV is the magnet room itself.

The static magnetic field is always on. Ferromagnetic objects can become projectiles. Hearing protection, quench awareness, and clear communication with patients and coworkers are part of everyday safe practice.

Key takeaways:
• Know your facility's zone map and badge rules
• Treat the magnet as always active
• Stop and escalate if screening is incomplete`,
          quizQuestions: [
            {
              id: "course-mri-safety-mq1",
              prompt: "Which MRI zone is the magnet room itself?",
              choices: ["Zone I", "Zone II", "Zone III", "Zone IV"],
              correctIndex: 3,
            },
            {
              id: "course-mri-safety-mq2",
              prompt: "The static magnetic field in a clinical MRI suite is:",
              choices: [
                "Only on during image acquisition",
                "Always on",
                "Turned off overnight for cleaning",
                "Safe for all metal objects outside Zone IV",
              ],
              correctIndex: 1,
            },
          ],
        },
        {
          id: "course-mri-safety-mod-2",
          title: "Module 2 — Screening, implants, and final exam prep",
          content: `Patient and staff screening is the primary control that prevents MRI adverse events.

Use your facility's current screening form. Ask about implants, prior surgeries, foreign bodies, and occupational metal exposure. When implant status is unclear, pause the exam and verify with documentation or a radiologist/MRI safety officer.

Conditional implants may require specific conditions (field strength, SAR, body region). "MR Unsafe" items must not enter the MRI environment. Document decisions and communicate clearly with the care team.

Before the final exam, review:
• Zone purposes and access control
• Projectile and quench awareness
• Screening steps and implant categories
• When to stop and escalate`,
          quizQuestions: [
            {
              id: "course-mri-safety-mq3",
              prompt: "If a patient cannot confirm implant details, the safest next step is to:",
              choices: [
                "Proceed with a shorter protocol",
                "Pause and verify before scanning",
                "Ask a coworker to guess",
                "Skip screening for follow-up exams",
              ],
              correctIndex: 1,
            },
            {
              id: "course-mri-safety-mq4",
              prompt: "An item labeled MR Unsafe should:",
              choices: [
                "Enter Zone IV only with supervision",
                "Never enter the MRI environment",
                "Be allowed if the patient consents",
                "Be used only at 1.5T",
              ],
              correctIndex: 1,
            },
          ],
        },
      ],
      examQuestions: [
        {
          id: "mri-ex-1",
          prompt: "Zone IV refers to:",
          choices: [
            "The waiting room",
            "The magnet room",
            "The control desk only",
            "Public hallways",
          ],
          correctIndex: 1,
        },
        {
          id: "mri-ex-2",
          prompt: "Ferromagnetic objects near the MRI bore create risk primarily because they can:",
          choices: [
            "Improve image contrast",
            "Become projectiles",
            "Reduce acoustic noise",
            "Cool the magnet",
          ],
          correctIndex: 1,
        },
        {
          id: "mri-ex-3",
          prompt: "MRI screening should include questions about:",
          choices: [
            "Implants, surgeries, and metal exposure",
            "Preferred music only",
            "Insurance plan tier only",
            "Previous CT contrast brand only",
          ],
          correctIndex: 0,
        },
        {
          id: "mri-ex-4",
          prompt: "The static field of a superconducting clinical magnet is typically:",
          choices: [
            "Off between patients",
            "Always on",
            "On only for contrast exams",
            "Disabled during code situations automatically",
          ],
          correctIndex: 1,
        },
        {
          id: "mri-ex-5",
          prompt: "When implant conditions are unclear, the technologist should:",
          choices: [
            "Scan quickly at lower resolution",
            "Stop and obtain verification before proceeding",
            "Rely on the patient's verbal guess",
            "Mark the exam as completed without imaging",
          ],
          correctIndex: 1,
        },
        {
          id: "mri-ex-6",
          prompt: "Zone III is best described as:",
          choices: [
            "A public unrestricted area",
            "A restricted area near the magnet with controlled access",
            "The outdoor parking lot",
            "The reading room for radiologists only",
          ],
          correctIndex: 1,
        },
        {
          id: "mri-ex-7",
          prompt: "Hearing protection in MRI is important because:",
          choices: [
            "Gradient noise can be loud during scanning",
            "It replaces the need for screening",
            "It turns off the static field",
            "It prevents all implant heating",
          ],
          correctIndex: 0,
        },
        {
          id: "mri-ex-8",
          prompt: "An MR Conditional implant means:",
          choices: [
            "It is safe under all MRI conditions",
            "It may be scanned only under specified conditions",
            "It is always unsafe at any field strength",
            "It does not require documentation",
          ],
          correctIndex: 1,
        },
      ],
      createdAt: "2026-07-01T12:00:00.000Z",
      updatedAt: "2026-07-01T12:00:00.000Z",
    },
  ],
  enrollments: [
    {
      id: "enroll-1",
      userId: "user-student-1",
      courseId: "course-rad-fundamentals",
      status: "in_progress",
      progressPercent: 50,
      completedModuleIds: ["course-rad-fundamentals-mod-1"],
      purchasedAt: "2026-06-01T14:00:00.000Z",
      lastActivityAt: "2026-07-10T16:00:00.000Z",
    },
    {
      id: "enroll-2",
      userId: "user-student-2",
      courseId: "course-mammo-basics",
      status: "exam_ready",
      progressPercent: 100,
      completedModuleIds: [
        "course-mammo-basics-mod-1",
        "course-mammo-basics-mod-2",
      ],
      purchasedAt: "2026-06-15T10:00:00.000Z",
      lastActivityAt: "2026-07-12T11:00:00.000Z",
    },
    {
      id: "enroll-mri-demo",
      userId: "user-student-1",
      courseId: "course-mri-safety",
      status: "exam_ready",
      progressPercent: 100,
      completedModuleIds: [
        "course-mri-safety-mod-1",
        "course-mri-safety-mod-2",
      ],
      purchasedAt: "2026-07-20T14:00:00.000Z",
      lastActivityAt: "2026-07-28T16:00:00.000Z",
    },
  ],
  certificates: [],
  bundles: [
    {
      id: "bundle-rad-core",
      title: "Radiology Core Bundle",
      slug: "radiology-core-bundle",
      description:
        "Save when you enroll in Radiographic Fundamentals and CT Dose & Patient Safety together.",
      courseIds: ["course-rad-fundamentals", "course-ct-safety"],
      priceCents: 7900,
      published: true,
      createdAt: "2026-04-01T12:00:00.000Z",
    },
  ],
  discountCodes: [
    {
      id: "promo-welcome10",
      code: "WELCOME10",
      percentOff: 10,
      active: true,
      redemptionCount: 0,
      maxRedemptions: 500,
      createdAt: "2026-04-01T12:00:00.000Z",
    },
  ],
  reviews: [
    {
      id: "review-1",
      courseId: "course-rad-fundamentals",
      userId: "user-student-2",
      userName: "Jamie Chen",
      rating: 5,
      comment:
        "Clear modules and a fair exam. Exactly what I needed for renewal without wasting a weekend.",
      createdAt: "2026-07-01T12:00:00.000Z",
    },
    {
      id: "review-2",
      courseId: "course-mammo-basics",
      userId: "user-student-1",
      userName: "Sam Rivera",
      rating: 4,
      comment:
        "Practical content that matches what we do on the floor. Progress saving made studying around shifts easy.",
      createdAt: "2026-07-05T12:00:00.000Z",
    },
  ],
  tickets: [],
  faqs: [
    {
      id: "faq-1",
      question: "Are RodzEdu credits accepted for ARRT® renewal?",
      answer:
        "RodzEdu courses are designed around Category A / A+ style continuing education for radiologic technologists. Always confirm acceptance with your state licensing board or credentialing body for your specific renewal requirements.",
      sortOrder: 1,
    },
    {
      id: "faq-2",
      question: "Can I save progress and finish later?",
      answer:
        "Yes. Complete modules at your own pace. Your progress is saved so you can return after a shift and pick up where you left off before taking the final exam.",
      sortOrder: 2,
    },
    {
      id: "faq-3",
      question: "How do I get my certificate?",
      answer:
        "After you pass the final exam with a score of 75% or higher, your certificate is issued automatically. Download or print it from your student portal at any time.",
      sortOrder: 3,
    },
    {
      id: "faq-4",
      question: "Do you offer bundles or discount codes?",
      answer:
        "Yes. Course bundles appear in the catalog when available, and you can enter a discount code at checkout. Contact us if you need an employer or group option.",
      sortOrder: 4,
    },
    {
      id: "faq-5",
      question: "Who do I contact for help with a course?",
      answer:
        "Use the contact form, email support during office hours, or open Help from your student learning page for the specific course you are taking.",
      sortOrder: 5,
    },
  ],
  testimonials: [
    {
      id: "testimonial-1",
      name: "Sam Rivera",
      credentials: "RT(R), Louisville, KY",
      quote:
        "RodzEdu made renewal straightforward — clear modules, a real exam, and a certificate I could download the same day I passed.",
      published: true,
    },
    {
      id: "testimonial-2",
      name: "Jamie Chen",
      credentials: "RT(R)(M), outpatient imaging",
      quote:
        "I studied between shifts and never lost my place. The content felt written for working techs, not filler hours.",
      published: true,
    },
    {
      id: "testimonial-3",
      name: "Alex Morgan",
      credentials: "CT technologist",
      quote:
        "Transparent pricing and support when I had an order question. That alone made me trust the platform.",
      published: true,
    },
  ],
};

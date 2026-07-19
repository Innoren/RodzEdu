import type { Database } from "./types";

export const seedData: Database = {
  settings: {
    companyName: "RodzEdu",
    tagline:
      "Continuing education imaging professionals can trust — clear courses, credible credits, real support.",
    phone: "502-555-0199",
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
      name: "Alex Rodz",
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
      name: "Dr. Morgan Ellis",
      role: "teacher",
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
    {
      id: "course-rad-fundamentals",
      title: "Radiographic Fundamentals Review",
      slug: "radiographic-fundamentals-review",
      category: "Radiography",
      credits: 4,
      priceCents: 4900,
      description:
        "A focused review of radiographic technique, patient positioning, and image quality essentials for practicing technologists.",
      published: true,
      content:
        "This course covers exposure factors, contrast and density relationships, grids, collimation, and common positioning series. Complete all modules, then take the online exam to earn your CE certificate.",
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
    },
    {
      id: "course-mammo-basics",
      title: "Mammography Essentials",
      slug: "mammography-essentials",
      category: "Mammography",
      credits: 6,
      priceCents: 6900,
      description:
        "Core mammography imaging principles, quality control concepts, and patient care considerations for CE credit.",
      published: true,
      content:
        "Explore breast anatomy for imaging, standard projections, compression technique, and quality assurance workflows used in mammography departments.",
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
    },
    {
      id: "course-ct-safety",
      title: "CT Dose & Patient Safety",
      slug: "ct-dose-patient-safety",
      category: "Computed Tomography",
      credits: 3,
      priceCents: 3900,
      description:
        "Practical CT dose optimization strategies and patient safety practices for CT technologists.",
      published: true,
      content:
        "Review ALARA principles in CT, automatic exposure control, pediatric considerations, and communication strategies that support safer imaging.",
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
    },
  ],
  enrollments: [
    {
      id: "enroll-1",
      userId: "user-student-1",
      courseId: "course-rad-fundamentals",
      status: "in_progress",
      progressPercent: 60,
      purchasedAt: "2026-06-01T14:00:00.000Z",
      lastActivityAt: "2026-07-10T16:00:00.000Z",
    },
    {
      id: "enroll-2",
      userId: "user-student-2",
      courseId: "course-mammo-basics",
      status: "exam_ready",
      progressPercent: 100,
      purchasedAt: "2026-06-15T10:00:00.000Z",
      lastActivityAt: "2026-07-12T11:00:00.000Z",
    },
  ],
};

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  advanceEnrollmentProgress,
  enrollUser,
  getEnrollmentById,
  listPublishedCourses,
  reassignEnrollmentCourse,
  resetEnrollmentModules,
  staffCanManageStudent,
} from "@/lib/db";

const STAFF_ROLES = new Set(["teacher", "admin", "ceo"]);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !STAFF_ROLES.has(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const action = String(body.action || "");

  if (action === "reset") {
    const enrollmentId = String(body.enrollmentId || "");
    const enrollment = await getEnrollmentById(enrollmentId);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }
    if (!(await staffCanManageStudent(user, enrollment.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const result = await resetEnrollmentModules(enrollmentId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ enrollment: result });
  }

  if (action === "reassign") {
    const enrollmentId = String(body.enrollmentId || "");
    const courseId = String(body.courseId || "");
    const enrollment = await getEnrollmentById(enrollmentId);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }
    if (!(await staffCanManageStudent(user, enrollment.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const result = await reassignEnrollmentCourse(enrollmentId, courseId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ enrollment: result });
  }

  if (action === "assign") {
    const studentId = String(body.studentId || "");
    const courseId = String(body.courseId || "");
    if (!(await staffCanManageStudent(user, studentId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const courses = await listPublishedCourses();
    if (!courses.some((c) => c.id === courseId)) {
      return NextResponse.json(
        { error: "Published course not found." },
        { status: 400 },
      );
    }
    const enrollment = await enrollUser(studentId, courseId);
    return NextResponse.json({ enrollment });
  }

  if (action === "advance" || action === "unlock_exam") {
    const enrollmentId = String(body.enrollmentId || "");
    const enrollment = await getEnrollmentById(enrollmentId);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }
    if (!(await staffCanManageStudent(user, enrollment.userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await advanceEnrollmentProgress({
      enrollmentId,
      unlockExam: action === "unlock_exam" || Boolean(body.unlockExam),
      resumeAtModuleNumber:
        body.resumeAtModuleNumber !== undefined &&
        body.resumeAtModuleNumber !== ""
          ? Number(body.resumeAtModuleNumber)
          : undefined,
    });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ enrollment: result });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

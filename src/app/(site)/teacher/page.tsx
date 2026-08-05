import { requireUser } from "@/lib/auth";
import {
  listEnrollmentsForStaff,
  listPublishedCourses,
  listStudentsForStaff,
} from "@/lib/db";
import { formatDate, statusLabel } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";
import { StudentEnrollmentActions } from "@/components/StudentEnrollmentActions";
import { AssignCourseForm } from "@/components/AssignCourseForm";

export default async function TeacherPortalPage() {
  const user = await requireUser(["teacher", "admin", "ceo"]);
  const [rows, courses, students] = await Promise.all([
    listEnrollmentsForStaff(user),
    listPublishedCourses(),
    listStudentsForStaff(user),
  ]);

  const scopeLabel =
    user.role === "teacher"
      ? "your assigned learners"
      : "all students on the platform";

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">
            {user.role === "teacher" ? "Teacher portal" : "Staff portal"}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Student progress & course assignment
          </h1>
          <p className="mt-3 text-muted">
            Monitor enrollments for {scopeLabel}. Reset module progress or
            reassign courses when a learner needs a fresh start.
          </p>

          <AssignCourseForm students={students} courses={courses} />

          <div className="panel mt-8 overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-line bg-sand/60 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last activity</th>
                  <th className="px-4 py-3 font-semibold">Manage</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-muted">
                      No student enrollments yet. Assign a course above to get
                      started.
                    </td>
                  </tr>
                )}
                {rows.map(({ student, enrollment, course }) => (
                  <tr key={enrollment.id} className="border-b border-line/70">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-navy">{student.name}</p>
                      <p className="text-xs text-muted">{student.email}</p>
                    </td>
                    <td className="px-4 py-4 text-ink/85">{course.title}</td>
                    <td className="px-4 py-4">
                      <div className="w-32">
                        <div className="mb-1 text-xs font-semibold text-navy">
                          {enrollment.progressPercent}%
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${enrollment.progressPercent}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {statusLabel(enrollment.status)}
                      {typeof enrollment.score === "number"
                        ? ` (${enrollment.score}%)`
                        : ""}
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {formatDate(enrollment.lastActivityAt)}
                    </td>
                    <td className="px-4 py-4">
                      <StudentEnrollmentActions
                        enrollmentId={enrollment.id}
                        currentCourseId={course.id}
                        courses={courses}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

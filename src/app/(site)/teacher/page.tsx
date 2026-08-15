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
    <section className="section !px-4 !py-8 md:!px-5 md:!py-[4.5rem]">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div className="min-w-0">
          <p className="eyebrow">
            {user.role === "teacher" ? "Teacher portal" : "Staff portal"}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight text-navy md:text-4xl">
            Student progress & course assignment
          </h1>
          <p className="mt-3 text-muted">
            Monitor enrollments for {scopeLabel}. Fast-forward to any module,
            unlock the final exam, reset progress, reassign courses, or unenroll
            students.
          </p>

          <AssignCourseForm students={students} courses={courses} />

          {/* Mobile: stacked cards (desktop table unchanged below) */}
          <div className="mt-8 space-y-4 md:hidden">
            {rows.length === 0 ? (
              <div className="panel p-5 text-sm text-muted">
                No student enrollments yet. Assign a course above to get
                started.
              </div>
            ) : (
              rows.map(({ student, enrollment, course }) => (
                <article key={enrollment.id} className="panel p-4">
                  <div className="border-b border-line pb-3">
                    <p className="font-semibold text-navy">{student.name}</p>
                    <p className="break-all text-xs text-muted">
                      {student.email}
                    </p>
                    <p className="mt-2 text-sm text-ink/85">{course.title}</p>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.08em] text-muted">
                        Progress
                      </dt>
                      <dd className="mt-1">
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
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.08em] text-muted">
                        Status
                      </dt>
                      <dd className="mt-1 text-navy">
                        {statusLabel(enrollment.status)}
                        {typeof enrollment.score === "number"
                          ? ` (${enrollment.score}%)`
                          : ""}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs uppercase tracking-[0.08em] text-muted">
                        Last activity
                      </dt>
                      <dd className="mt-1 text-muted">
                        {formatDate(enrollment.lastActivityAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-line pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      Manage
                    </p>
                    <StudentEnrollmentActions
                      enrollmentId={enrollment.id}
                      currentCourseId={course.id}
                      courses={courses}
                      modules={course.modules.map((module) => ({
                        id: module.id,
                        title: module.title,
                      }))}
                      compactMobile
                    />
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Desktop: original table layout */}
          <div className="panel mt-8 hidden overflow-x-auto md:block">
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
                        modules={course.modules.map((module) => ({
                          id: module.id,
                          title: module.title,
                        }))}
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

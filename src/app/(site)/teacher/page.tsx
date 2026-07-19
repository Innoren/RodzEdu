import { requireUser } from "@/lib/auth";
import { listEnrollmentsForTeacher } from "@/lib/db";
import { formatDate, statusLabel } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";

export default async function TeacherPortalPage() {
  const user = await requireUser(["teacher", "ceo"]);
  const rows = await listEnrollmentsForTeacher(
    user.role === "teacher" ? user.id : "user-teacher",
  );

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Teacher portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Student progress overview
          </h1>
          <p className="mt-3 text-muted">
            Monitor enrollments, module completion, exam readiness, and CE
            outcomes for your learners.
          </p>

          <div className="panel mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line bg-sand/60 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-muted">
                      No student enrollments yet.
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
                            style={{ width: `${enrollment.progressPercent}%` }}
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

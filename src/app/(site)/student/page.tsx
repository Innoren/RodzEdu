import Link from "next/link";
import Stripe from "stripe";
import { requireUser } from "@/lib/auth";
import {
  getCourseById,
  listCertificatesForUser,
  listEnrollmentsForUser,
} from "@/lib/db";
import {
  canAttemptExam,
  examAttemptLabel,
  examAttemptsRemaining,
  normalizeMaxExamAttempts,
} from "@/lib/examAttempts";
import { fulfillPaidCheckoutSession } from "@/lib/fulfillCheckout";
import { formatDate, statusLabel } from "@/lib/format";
import { ClearPurchasedCartItem } from "@/components/ClearPurchasedCartItem";
import { PortalNav } from "@/components/PortalNav";
import { OpenExamButton } from "@/components/OpenExamButton";

async function confirmStripePurchase(
  userId: string,
  sessionId: string,
): Promise<{ purchasedSlug?: string; paymentError?: string }> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return {
      paymentError:
        "Payment confirmation is unavailable. If you were charged, contact support.",
    };
  }

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== userId) {
      return {
        paymentError: "This payment does not belong to your account.",
      };
    }

    const result = await fulfillPaidCheckoutSession(session);
    if (result.ok) {
      return { purchasedSlug: result.successSlug };
    }
    if (result.reason === "unpaid" || result.reason === "incomplete") {
      return {
        paymentError:
          "Payment was not completed, so the course was not unlocked.",
      };
    }
    return {
      paymentError:
        "We could not confirm this payment. If you were charged, contact support.",
    };
  } catch {
    return {
      paymentError:
        "We could not verify this payment yet. Refresh in a moment, or contact support if you were charged.",
    };
  }
}

export default async function StudentPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string; session_id?: string }>;
}) {
  const user = await requireUser(["student"]);
  const params = await searchParams;

  let purchasedSlug = params.purchased?.trim() || "";
  let paymentError = "";

  if (params.session_id) {
    const confirmation = await confirmStripePurchase(user.id, params.session_id);
    if (confirmation.purchasedSlug) {
      purchasedSlug = confirmation.purchasedSlug;
    }
    if (confirmation.paymentError) {
      paymentError = confirmation.paymentError;
    }
  }

  const [enrollments, certificates] = await Promise.all([
    listEnrollmentsForUser(user.id),
    listCertificatesForUser(user.id),
  ]);

  const rows = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = await getCourseById(enrollment.courseId);
      return { enrollment, course };
    }),
  );

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Student portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Your CE progress
          </h1>
          <p className="mt-3 text-muted">
            Save module progress, take built-in quizzes, pass the final exam,
            and download your certificate automatically.
          </p>

          {paymentError ? (
            <div className="mt-5 rounded-sm border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-navy">
              {paymentError}
            </div>
          ) : null}

          {purchasedSlug && !paymentError ? (
            <>
              <ClearPurchasedCartItem slug={purchasedSlug} />
              <div className="mt-5 rounded-sm border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-navy">
                Enrollment confirmed for <strong>{purchasedSlug}</strong>. Your
                course is ready below.
              </div>
            </>
          ) : null}

          <div className="mt-8 space-y-4">
            {rows.length === 0 && (
              <div className="panel p-6">
                <p className="text-navy">No courses yet.</p>
                <Link href="/courses" className="btn btn-primary mt-4">
                  Browse & enroll
                </Link>
              </div>
            )}

            {rows.map(({ enrollment, course }) => {
              if (!course) return null;
              const modulesDone = enrollment.progressPercent >= 100;
              const maxExamAttempts = normalizeMaxExamAttempts(
                course.maxExamAttempts,
              );
              const examAttemptCount = Math.max(
                0,
                Number(enrollment.examAttemptCount || 0),
              );
              const remaining = examAttemptsRemaining(
                maxExamAttempts,
                examAttemptCount,
              );
              const attemptsOk = canAttemptExam({
                maxExamAttempts,
                examAttemptCount,
                status: enrollment.status,
              });
              const examReady = modulesDone && attemptsOk;
              const certificateId = enrollment.certificateId;
              const examHint = !modulesDone
                ? "Complete every module quiz to unlock the final exam."
                : !attemptsOk &&
                    (enrollment.status === "completed" ||
                      enrollment.status === "exam_passed")
                  ? "Exam already passed."
                  : !attemptsOk
                    ? `No exam attempts left (${examAttemptLabel(maxExamAttempts)}).`
                    : remaining === null
                      ? `${examAttemptLabel(maxExamAttempts)} · Attempt ${examAttemptCount + 1}`
                      : `${remaining} of ${maxExamAttempts} attempt${
                          maxExamAttempts === 1 ? "" : "s"
                        } remaining`;

              return (
                <article key={enrollment.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal">
                        {course.category}
                      </p>
                      <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-navy">
                        {course.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        Purchased {formatDate(enrollment.purchasedAt)} ·{" "}
                        {statusLabel(enrollment.status)}
                        {typeof enrollment.score === "number"
                          ? ` · Score ${enrollment.score}%`
                          : ""}
                        {` · ${examAttemptLabel(maxExamAttempts)}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-navy">
                      {course.credits} CE credits
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted">
                        Modules {enrollment.completedModuleIds?.length || 0}/
                        {course.modules?.length || 0}
                      </span>
                      <span className="font-semibold text-navy">
                        {enrollment.progressPercent}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${enrollment.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/student/learn/${enrollment.id}`}
                      className="btn btn-primary !px-3 !py-2 text-sm"
                    >
                      {enrollment.status === "completed"
                        ? "Review modules"
                        : "Continue learning"}
                    </Link>
                    <OpenExamButton
                      enrollmentId={enrollment.id}
                      disabled={!examReady}
                      label={
                        examAttemptCount > 0 && attemptsOk
                          ? "Retake final exam"
                          : "Take final exam"
                      }
                      hint={examHint}
                    />
                    {certificateId ? (
                      <Link
                        href={`/student/certificates/${certificateId}`}
                        className="btn btn-navy !px-3 !py-2 text-sm"
                      >
                        Download certificate
                      </Link>
                    ) : null}
                    <Link
                      href={`/courses/${course.slug}`}
                      className="btn btn-ghost !px-3 !py-2 text-sm"
                    >
                      Course details
                    </Link>
                  </div>
                  {enrollment.status === "completed" && !certificateId && (
                    <p className="mt-3 text-xs text-muted">
                      Certificate issuance is linked to a passing exam score.
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {certificates.length > 0 && (
            <div className="mt-10">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
                Your certificates
              </h2>
              <ul className="mt-4 space-y-2">
                {certificates.map((cert) => (
                  <li key={cert.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold text-navy">{cert.courseTitle}</p>
                      <p className="text-sm text-muted">
                        {cert.certificateNumber} · Issued {formatDate(cert.issuedAt)}
                      </p>
                    </div>
                    <Link
                      href={`/student/certificates/${cert.id}`}
                      className="btn btn-ghost !px-3 !py-2 text-sm"
                    >
                      Download
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

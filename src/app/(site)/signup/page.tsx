import Link from "next/link";

const signupErrors: Record<string, string> = {
  mismatch: "Passwords do not match. Please try again.",
  exists: "An account with that email already exists. Log in instead.",
  invalid: "Enter your name, email, and a password of at least 6 characters.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const error = params.error
    ? signupErrors[params.error] || signupErrors.invalid
    : null;
  const loginHref = params.next
    ? `/login?next=${encodeURIComponent(params.next)}`
    : "/login";

  return (
    <section className="section">
      <div className="section-inner grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <p className="eyebrow">New student</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Create your RodzEdu account
          </h1>
          <p className="mt-4 max-w-md text-muted">
            Set up a student account to enroll in courses, track your progress,
            and take CE exams online.
          </p>
          <Link
            href={loginHref}
            className="mt-6 inline-block text-sm font-semibold text-teal"
          >
            ← Back to sign in
          </Link>
        </div>

        <form action="/api/auth/signup" method="post" className="panel p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
            Create an account
          </h2>
          {error && (
            <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {params.next && (
            <input type="hidden" name="next" value={params.next} />
          )}
          <label className="mt-5 block text-sm font-medium text-navy">
            Full name
            <input
              type="text"
              name="name"
              required
              className="mt-1 w-full border border-line px-3 py-2 outline-none focus:border-teal"
              placeholder="Sam Rivera"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-navy">
            Email
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full border border-line px-3 py-2 outline-none focus:border-teal"
              placeholder="you@clinic.com"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-navy">
            Password
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="mt-1 w-full border border-line px-3 py-2 outline-none focus:border-teal"
              placeholder="At least 6 characters"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-navy">
            Confirm password
            <input
              type="password"
              name="confirm"
              required
              minLength={6}
              className="mt-1 w-full border border-line px-3 py-2 outline-none focus:border-teal"
            />
          </label>
          <button type="submit" className="btn btn-primary mt-6 w-full">
            Create account
          </button>
          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href={loginHref} className="font-semibold text-teal">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

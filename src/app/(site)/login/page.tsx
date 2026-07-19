import Link from "next/link";

const signupErrors: Record<string, string> = {
  mismatch: "Passwords do not match. Please try again.",
  exists: "An account with that email already exists. Log in instead.",
  invalid: "Enter your name, email, and a password of at least 6 characters.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signup_error?: string }>;
}) {
  const params = await searchParams;
  const signupError = params.signup_error
    ? signupErrors[params.signup_error] || signupErrors.invalid
    : null;

  return (
    <section className="section">
      <div className="section-inner grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <p className="eyebrow">Account access</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Log in to RodzEdu
          </h1>
          <p className="mt-4 max-w-md text-muted">
            Sign in to access your courses, track module progress, and take CE
            exams online.
          </p>
        </div>

        <div className="space-y-6">
          <form action="/api/auth/login" method="post" className="panel p-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              Sign in
            </h2>
            {params.error && (
              <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
                Invalid email or password. Try a demo account above.
              </p>
            )}
            <label className="mt-5 block text-sm font-medium text-navy">
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
                className="mt-1 w-full border border-line px-3 py-2 outline-none focus:border-teal"
              />
            </label>
            <button type="submit" className="btn btn-primary mt-6 w-full">
              Log In
            </button>
            <p className="mt-4 text-center text-sm text-muted">
              New here?{" "}
              <a href="#signup" className="font-semibold text-teal">
                Create an account
              </a>
            </p>
          </form>

          <form
            id="signup"
            action="/api/auth/signup"
            method="post"
            className="panel scroll-mt-28 p-6"
          >
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
              Sign up
            </h2>
            <p className="mt-2 text-sm text-muted">
              Create a student account to enroll in courses, track progress, and
              take CE exams.
            </p>
            {signupError && (
              <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
                {signupError}
              </p>
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
            <button type="submit" className="btn btn-navy mt-6 w-full">
              Create student account
            </button>
            <p className="mt-4 text-center text-sm text-muted">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-teal">
                Sign in above
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

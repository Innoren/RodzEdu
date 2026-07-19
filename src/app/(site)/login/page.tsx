import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const signupHref = params.next
    ? `/signup?next=${encodeURIComponent(params.next)}`
    : "/signup";

  return (
    <section className="section">
      <div className="section-inner grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <p className="eyebrow">Account access</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Log in to RodzEdu
          </h1>
          <p className="mt-4 max-w-md text-muted">
            Sign in to continue your coursework, track progress, and complete CE
            exams when you&apos;re ready.
          </p>
        </div>

        <form action="/api/auth/login" method="post" className="panel p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-navy">
            Sign in
          </h2>
          {params.error && (
            <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">
              Invalid email or password. Please try again.
            </p>
          )}
          {params.next && (
            <input type="hidden" name="next" value={params.next} />
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
            <Link href={signupHref} className="font-semibold text-teal">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

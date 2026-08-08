"use client";

export function CheckoutForm({
  courseId,
  bundleId,
  className,
}: {
  courseId?: string;
  bundleId?: string;
  className?: string;
}) {
  return (
    <form action="/api/checkout" method="post" className={className}>
      {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}
      {bundleId ? <input type="hidden" name="bundleId" value={bundleId} /> : null}

      <div className="mb-3 border border-line bg-mist/60 p-3">
        <label className="block text-sm font-medium text-navy">
          Discount code
          <span className="ml-1 font-normal text-muted">(optional)</span>
          <input
            name="discountCode"
            placeholder="Enter code, e.g. WELCOME10"
            autoComplete="off"
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 uppercase tracking-wide"
          />
        </label>
      </div>

      <button type="submit" className="btn btn-primary w-full">
        Enroll securely
      </button>
    </form>
  );
}

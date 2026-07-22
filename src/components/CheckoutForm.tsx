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
      <label className="mb-3 block text-sm font-medium text-navy">
        Discount code (optional)
        <input
          name="discountCode"
          placeholder="WELCOME10"
          className="mt-1 w-full border border-line px-3 py-2 uppercase"
        />
      </label>
      <button type="submit" className="btn btn-primary w-full">
        Enroll securely
      </button>
    </form>
  );
}

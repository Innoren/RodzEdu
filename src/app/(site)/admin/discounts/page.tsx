import { requireUser } from "@/lib/auth";
import { listDiscountCodes } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PortalNav } from "@/components/PortalNav";
import { DiscountForm } from "@/components/DiscountForm";

export default async function DiscountsAdminPage() {
  const user = await requireUser(["admin", "ceo"]);
  const codes = await listDiscountCodes();

  return (
    <section className="section">
      <div className="section-inner grid gap-6 md:grid-cols-[240px_1fr]">
        <PortalNav role={user.role} name={user.name} />
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-navy">
            Discount codes
          </h1>
          <p className="mt-3 mb-6 text-muted">
            Create percent or fixed-amount codes students can apply at checkout.
            Demo code: <strong>WELCOME10</strong> (10% off).
          </p>
          <DiscountForm />
          <div className="mt-8 space-y-3">
            {codes.map((code) => (
              <article key={code.id} className="panel p-4">
                <p className="font-semibold text-navy">{code.code}</p>
                <p className="text-sm text-muted">
                  {code.percentOff
                    ? `${code.percentOff}% off`
                    : code.amountOffCents
                      ? `${formatMoney(code.amountOffCents)} off`
                      : "Custom"}
                  {" · "}
                  {code.redemptionCount} used
                  {code.maxRedemptions ? ` / ${code.maxRedemptions}` : ""}
                  {code.active ? " · Active" : " · Inactive"}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

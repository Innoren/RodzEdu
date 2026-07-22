import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createDiscountCode,
  findDiscountCode,
  listDiscountCodes,
  priceWithDiscount,
} from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ discountCodes: await listDiscountCodes() });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const body = await request.json();
  const action = String(body.action || "create");

  if (action === "validate") {
    const code = await findDiscountCode(String(body.code || ""));
    const priceCents = Number(body.priceCents || 0);
    if (!code || !code.active) {
      return NextResponse.json({ error: "Invalid discount code." }, { status: 400 });
    }
    const priced = priceWithDiscount(priceCents, code);
    if (priced.discountCents <= 0) {
      return NextResponse.json(
        { error: "This discount code cannot be applied." },
        { status: 400 },
      );
    }
    return NextResponse.json({
      code: code.code,
      ...priced,
    });
  }

  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const percentOff = body.percentOff ? Number(body.percentOff) : undefined;
  const amountOff = body.amountOff ? Number(body.amountOff) : undefined;

  const result = await createDiscountCode({
    code: String(body.code || ""),
    percentOff,
    amountOffCents:
      typeof amountOff === "number" ? Math.round(amountOff * 100) : undefined,
    maxRedemptions: body.maxRedemptions
      ? Number(body.maxRedemptions)
      : undefined,
    expiresAt: body.expiresAt ? String(body.expiresAt) : undefined,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ discountCode: result });
}

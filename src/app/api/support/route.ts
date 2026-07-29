import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createSupportTicket,
  listSupportTickets,
  updateSupportTicketStatus,
} from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "ceo")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ tickets: await listSupportTickets() });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  const body = await request.json();

  if (body.action === "updateStatus") {
    if (!user || (user.role !== "admin" && user.role !== "ceo")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ticket = await updateSupportTicketStatus(
      String(body.id || ""),
      body.status,
    );
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  }

  const result = await createSupportTicket({
    name: String(body.name || user?.name || ""),
    email: String(body.email || user?.email || ""),
    subject: String(body.subject || ""),
    message: String(body.message || ""),
    courseId: body.courseId ? String(body.courseId) : undefined,
    userId: user?.id,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ticket: result });
}

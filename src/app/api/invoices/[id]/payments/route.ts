export const runtime = "edge";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isFinite(invoiceId)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const rows = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.paymentDate));
  return Response.json({ payments: rows }, { headers: { "Cache-Control": "no-store" } });
}

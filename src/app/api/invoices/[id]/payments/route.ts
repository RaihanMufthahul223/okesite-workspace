
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@libsql/client/web";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isFinite(invoiceId)) return Response.json({ error: "Invalid id" }, { status: 400 });
  try {
    const rows = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.paymentDate));
    return Response.json({ payments: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = String((e as Error)?.message ?? "");
    if (msg.includes("proof_url") || msg.includes("no such column")) {
      const client = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
      const rs = await client.execute({
        sql: `SELECT id, invoice_id as invoiceId, amount_paid as amountPaid, payment_date as paymentDate, payment_method as paymentMethod, note, proof_url as proofUrl FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC`,
        args: [invoiceId],
      });
      // libSQL may fail if proof_url missing, fallback without it
      let rows: Record<string, unknown>[] = rs.rows as unknown as Record<string, unknown>[];
      if (msg.includes("proof_url")) {
        try {
          const rs2 = await client.execute({
            sql: `SELECT id, invoice_id as invoiceId, amount_paid as amountPaid, payment_date as paymentDate, payment_method as paymentMethod, note FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC`,
            args: [invoiceId],
          });
          rows = rs2.rows as unknown as Record<string, unknown>[];
          const mapped = rows.map((r) => ({ id: Number(r.id), invoiceId: Number(r.invoiceId), amountPaid: Number(r.amountPaid), paymentDate: (r.paymentDate as string) ?? null, paymentMethod: (r.paymentMethod as string) ?? null, note: (r.note as string) ?? null, proofUrl: null }));
          return Response.json({ payments: mapped }, { headers: { "Cache-Control": "no-store" } });
        } catch {}
      }
      const mapped = rows.map((r) => ({ id: Number(r.id), invoiceId: Number(r.invoiceId), amountPaid: Number(r.amountPaid), paymentDate: (r.paymentDate as string) ?? null, paymentMethod: (r.paymentMethod as string) ?? null, note: (r.note as string) ?? null, proofUrl: (r.proofUrl as string) ?? null }));
      return Response.json({ payments: mapped }, { headers: { "Cache-Control": "no-store" } });
    }
    throw e;
  }
}

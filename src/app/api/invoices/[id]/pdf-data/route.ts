export const runtime = "edge";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { invoices, clients, services, payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
    return Response.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice) {
    return Response.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
  }

  let paymentRows: (typeof payments.$inferSelect)[] = [];
  try {
    paymentRows = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  } catch (e) {
    const msg = String((e as Error)?.message ?? "");
    if (msg.includes("proof_url") || msg.includes("no such column")) {
      const { createClient } = await import("@libsql/client/web");
      const clientRaw = createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN! });
      try {
        const rs = await clientRaw.execute({ sql: `SELECT id, invoice_id as invoiceId, amount_paid as amountPaid, payment_date as paymentDate, payment_method as paymentMethod, note, proof_url as proofUrl FROM payments WHERE invoice_id = ?`, args: [invoiceId] });
        paymentRows = (rs.rows as unknown as Record<string, unknown>[]).map((r) => ({ id: Number(r.id), invoiceId: Number(r.invoiceId), amountPaid: Number(r.amountPaid), paymentDate: (r.paymentDate as string) ?? null, paymentMethod: (r.paymentMethod as string) ?? null, note: (r.note as string) ?? null, proofUrl: (r.proofUrl as string) ?? null })) as unknown as typeof paymentRows;
      } catch {
        const rs2 = await clientRaw.execute({ sql: `SELECT id, invoice_id as invoiceId, amount_paid as amountPaid, payment_date as paymentDate, payment_method as paymentMethod, note FROM payments WHERE invoice_id = ?`, args: [invoiceId] });
        paymentRows = (rs2.rows as unknown as Record<string, unknown>[]).map((r) => ({ id: Number(r.id), invoiceId: Number(r.invoiceId), amountPaid: Number(r.amountPaid), paymentDate: (r.paymentDate as string) ?? null, paymentMethod: (r.paymentMethod as string) ?? null, note: (r.note as string) ?? null, proofUrl: null })) as unknown as typeof paymentRows;
      }
    } else throw e;
  }
  const [client, service] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1).then((r) => r[0] ?? null),
    db.select().from(services).where(eq(services.id, invoice.serviceId)).limit(1).then((r) => r[0] ?? null),
  ]);

  return Response.json(
    {
      invoice: {
        id: invoice.id,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
        clientId: invoice.clientId,
        serviceId: invoice.serviceId,
      },
      client: client
        ? { id: client.id, name: client.name, contactInfo: client.contactInfo, websiteUrl: client.websiteUrl }
        : { id: invoice.clientId, name: `Klien #${invoice.clientId}`, contactInfo: null, websiteUrl: null },
      service: service
        ? { id: service.id, name: service.name, basePrice: service.basePrice, description: service.description }
        : { id: invoice.serviceId, name: `Layanan #${invoice.serviceId}`, basePrice: invoice.totalAmount, description: null },
      payments: paymentRows.map((p) => ({
        id: p.id,
        amountPaid: p.amountPaid,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        note: p.note,
      })),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

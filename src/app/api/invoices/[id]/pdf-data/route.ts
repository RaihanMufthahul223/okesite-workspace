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

  const [client, service, paymentRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1).then((r) => r[0] ?? null),
    db.select().from(services).where(eq(services.id, invoice.serviceId)).limit(1).then((r) => r[0] ?? null),
    db.select().from(payments).where(eq(payments.invoiceId, invoiceId)),
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

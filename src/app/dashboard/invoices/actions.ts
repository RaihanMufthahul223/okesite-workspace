"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { invoices, payments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

// ─── Validation ───────────────────────────────────────────────────────────────
const CreateInvoiceSchema = z.object({
  clientId: z.coerce.number().int().positive("Klien wajib dipilih"),
  serviceId: z.coerce.number().int().positive("Layanan wajib dipilih"),
  totalAmount: z.coerce
    .number({ message: "Total harus berupa angka" })
    .positive("Total harus lebih dari 0"),
  dueDate: z.string().optional().or(z.literal("")),
});

const UpdateInvoiceSchema = z.object({
  clientId: z.coerce.number().int().positive("Klien wajib dipilih"),
  serviceId: z.coerce.number().int().positive("Layanan wajib dipilih"),
  totalAmount: z.coerce
    .number({ message: "Total harus berupa angka" })
    .positive("Total harus lebih dari 0"),
  dueDate: z.string().optional().or(z.literal("")),
});

const AddPaymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  amountPaid: z.coerce
    .number({ message: "Jumlah harus berupa angka" })
    .positive("Jumlah harus lebih dari 0"),
  paymentDate: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().max(50).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  proofUrl: z.string().max(500).optional().or(z.literal("")),
});

export type CreateInvoiceFormData = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof UpdateInvoiceSchema>;
export type AddPaymentFormData = z.infer<typeof AddPaymentSchema>;

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ─── Helper: retry Turso (simple) ───────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, tries = 2): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 150 * (i + 1)));
    }
  }
  throw last;
}

// ─── Create Invoice ─────────────────────────────────────────────────────────
export async function createInvoice(
  data: CreateInvoiceFormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = CreateInvoiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const { clientId, serviceId, totalAmount, dueDate } = parsed.data;

  try {
    const [row] = await withRetry(() =>
      db
        .insert(invoices)
        .values({
          clientId,
          serviceId,
          totalAmount,
          dueDate: dueDate || null,
          status: "UNPAID",
        })
        .returning({ id: invoices.id })
    );

    await logAudit({ userId, action: "CREATE", entity: "invoices", entityId: row?.id ?? null, detail: `Invoice ${row?.id} total ${totalAmount}` });
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");
    return { success: true, message: "Tagihan berhasil dibuat." };
  } catch (err) {
    console.error("[createInvoice] DB error:", err);
    return { success: false, error: "Gagal membuat tagihan. Coba lagi." };
  }
}

// ─── Add Payment (Bayar/Cicil) ──────────────────────────────────────────────
export async function addPayment(
  data: AddPaymentFormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = AddPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const { invoiceId, amountPaid, paymentDate, paymentMethod, note, proofUrl } =
    parsed.data;

  try {
    const [invoice] = await withRetry(() => db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1));

    if (!invoice) {
      return { success: false, error: "Tagihan tidak ditemukan." };
    }

    if (invoice.status === "PAID") {
      return { success: false, error: "Tagihan sudah lunas." };
    }

    const existing = await withRetry(() =>
      db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amountPaid}), 0)`,
        })
        .from(payments)
        .where(eq(payments.invoiceId, invoiceId))
    );

    const paidSoFar = Number(existing[0]?.total ?? 0);
    const remaining = invoice.totalAmount - paidSoFar;

    if (amountPaid > remaining) {
      return {
        success: false,
        error: `Melebihi sisa tagihan. Sisa: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(remaining)}`,
      };
    }

    try {
      await withRetry(() =>
        db.insert(payments).values({
          invoiceId,
          amountPaid,
          paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
          paymentMethod: paymentMethod || null,
          note: note || null,
          proofUrl: proofUrl || null,
        })
      );
    } catch (e) {
      const msg = String((e as Error)?.message ?? "");
      if (msg.includes("proof_url") || msg.includes("no such column")) {
        await withRetry(() =>
          db.insert(payments).values({
            invoiceId,
            amountPaid,
            paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
            paymentMethod: paymentMethod || null,
            note: note || null,
          } as never)
        );
      } else throw e;
    }

    const newTotal = paidSoFar + amountPaid;
    let newStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
    if (newTotal >= invoice.totalAmount) newStatus = "PAID";
    else if (newTotal > 0) newStatus = "PARTIAL";

    await withRetry(() => db.update(invoices).set({ status: newStatus }).where(eq(invoices.id, invoiceId)));

    await logAudit({ userId, action: "PAY", entity: "invoices", entityId: invoiceId, detail: `Pay ${amountPaid} -> ${newStatus}` });
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");
    return {
      success: true,
      message:
        newStatus === "PAID"
          ? "Pembayaran berhasil — tagihan lunas!"
          : "Pembayaran dicatat.",
    };
  } catch (err) {
    console.error("[addPayment] DB error:", err);
    return { success: false, error: "Gagal mencatat pembayaran. Coba lagi." };
  }
}

// ─── Delete Payment (hapus cicilan) ────────────────────────────────────────
export async function deletePayment(paymentId: number): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const [pay] = await withRetry(() => db.select().from(payments).where(eq(payments.id, paymentId)).limit(1));
    if (!pay) return { success: false, error: "Pembayaran tidak ditemukan." };

    const invoiceId = pay.invoiceId;
    await withRetry(() => db.delete(payments).where(eq(payments.id, paymentId)));

    // Recalc invoice status
    const [invoice] = await withRetry(() => db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1));
    if (invoice) {
      const agg = await withRetry(() =>
        db.select({ total: sql<number>`COALESCE(SUM(${payments.amountPaid}), 0)` }).from(payments).where(eq(payments.invoiceId, invoiceId))
      );
      const totalPaid = Number(agg[0]?.total ?? 0);
      let newStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
      if (totalPaid >= invoice.totalAmount) newStatus = "PAID";
      else if (totalPaid > 0) newStatus = "PARTIAL";
      await withRetry(() => db.update(invoices).set({ status: newStatus }).where(eq(invoices.id, invoiceId)));
    }

    await logAudit({ userId, action: "DELETE", entity: "payments", entityId: paymentId, detail: `Delete payment ${paymentId} of inv ${invoiceId}` });
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");
    return { success: true, message: "Pembayaran dihapus, status diperbarui." };
  } catch (err) {
    console.error("[deletePayment] DB error:", err);
    return { success: false, error: "Gagal menghapus pembayaran." };
  }
}

// ─── Update Invoice (Edit) ────────────────────────────────────────────────
export async function updateInvoice(
  id: number,
  data: UpdateInvoiceFormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = UpdateInvoiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const { clientId, serviceId, totalAmount, dueDate } = parsed.data;

  try {
    const [existing] = await withRetry(() => db.select().from(invoices).where(eq(invoices.id, id)).limit(1));

    if (!existing) {
      return { success: false, error: "Tagihan tidak ditemukan." };
    }

    const paidRows = await withRetry(() =>
      db
        .select({
          total: sql<number>`COALESCE(SUM(${payments.amountPaid}), 0)`,
        })
        .from(payments)
        .where(eq(payments.invoiceId, id))
    );

    const paidSoFar = Number(paidRows[0]?.total ?? 0);
    if (totalAmount < paidSoFar) {
      return {
        success: false,
        error: `Total baru tidak boleh kurang dari yang sudah terbayar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(paidSoFar)}`,
      };
    }

    let newStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
    if (paidSoFar >= totalAmount) newStatus = "PAID";
    else if (paidSoFar > 0) newStatus = "PARTIAL";

    await withRetry(() =>
      db
        .update(invoices)
        .set({
          clientId,
          serviceId,
          totalAmount,
          dueDate: dueDate || null,
          status: newStatus,
        })
        .where(eq(invoices.id, id))
    );

    await logAudit({ userId, action: "UPDATE", entity: "invoices", entityId: id, detail: `Update invoice` });
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");
    return { success: true, message: "Tagihan berhasil diperbarui." };
  } catch (err) {
    console.error("[updateInvoice] DB error:", err);
    return { success: false, error: "Gagal memperbarui tagihan. Coba lagi." };
  }
}

// ─── Delete Invoice ───────────────────────────────────────────────────────
export async function deleteInvoice(id: number): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const [existing] = await withRetry(() => db.select().from(invoices).where(eq(invoices.id, id)).limit(1));

    if (!existing) {
      return { success: false, error: "Tagihan tidak ditemukan." };
    }

    await withRetry(() => db.delete(payments).where(eq(payments.invoiceId, id)));
    await withRetry(() => db.delete(invoices).where(eq(invoices.id, id)));

    await logAudit({ userId, action: "DELETE", entity: "invoices", entityId: id, detail: `Delete invoice` });
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");
    return { success: true, message: "Tagihan berhasil dihapus." };
  } catch (err) {
    console.error("[deleteInvoice] DB error:", err);
    return { success: false, error: "Gagal menghapus tagihan. Coba lagi." };
  }
}

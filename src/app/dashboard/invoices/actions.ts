"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { invoices, payments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

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
});

export type CreateInvoiceFormData = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof UpdateInvoiceSchema>;
export type AddPaymentFormData = z.infer<typeof AddPaymentSchema>;

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

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
    await db.insert(invoices).values({
      clientId,
      serviceId,
      totalAmount,
      dueDate: dueDate || null,
      status: "UNPAID",
    });

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

  const { invoiceId, amountPaid, paymentDate, paymentMethod, note } =
    parsed.data;

  try {
    // Fetch invoice to validate
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      return { success: false, error: "Tagihan tidak ditemukan." };
    }

    if (invoice.status === "PAID") {
      return { success: false, error: "Tagihan sudah lunas." };
    }

    // Sum existing payments
    const existing = await db
      .select({
        total: sql<number>`COALESCE(SUM(${payments.amountPaid}), 0)`,
      })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));

    const paidSoFar = Number(existing[0]?.total ?? 0);
    const remaining = invoice.totalAmount - paidSoFar;

    if (amountPaid > remaining) {
      return {
        success: false,
        error: `Melebihi sisa tagihan. Sisa: ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(remaining)}`,
      };
    }

    await db.insert(payments).values({
      invoiceId,
      amountPaid,
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
      paymentMethod: paymentMethod || null,
      note: note || null,
    });

    // Re-calc status
    const newTotal = paidSoFar + amountPaid;
    let newStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
    if (newTotal >= invoice.totalAmount) newStatus = "PAID";
    else if (newTotal > 0) newStatus = "PARTIAL";

    await db
      .update(invoices)
      .set({ status: newStatus })
      .where(eq(invoices.id, invoiceId));

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
    const [existing] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Tagihan tidak ditemukan." };
    }

    // Hitung sudah terbayar agar total baru tidak < terbayar
    const paidRows = await db
      .select({
        total: sql<number>`COALESCE(SUM(${payments.amountPaid}), 0)`,
      })
      .from(payments)
      .where(eq(payments.invoiceId, id));

    const paidSoFar = Number(paidRows[0]?.total ?? 0);
    if (totalAmount < paidSoFar) {
      return {
        success: false,
        error: `Total baru tidak boleh kurang dari yang sudah terbayar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(paidSoFar)}`,
      };
    }

    // Recalc status berdasarkan total baru
    let newStatus: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
    if (paidSoFar >= totalAmount) newStatus = "PAID";
    else if (paidSoFar > 0) newStatus = "PARTIAL";

    await db
      .update(invoices)
      .set({
        clientId,
        serviceId,
        totalAmount,
        dueDate: dueDate || null,
        status: newStatus,
      })
      .where(eq(invoices.id, id));

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
    const [existing] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Tagihan tidak ditemukan." };
    }

    // Hapus payments terkait dulu (FK constraint)
    await db.delete(payments).where(eq(payments.invoiceId, id));
    await db.delete(invoices).where(eq(invoices.id, id));

    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard");
    return { success: true, message: "Tagihan berhasil dihapus." };
  } catch (err) {
    console.error("[deleteInvoice] DB error:", err);
    return { success: false, error: "Gagal menghapus tagihan. Coba lagi." };
  }
}

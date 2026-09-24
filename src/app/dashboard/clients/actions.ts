"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    new URL(withProto);
    return withProto;
  } catch {
    return null;
  }
}

function validateContact(contact?: string | null): string | null {
  if (!contact) return null;
  const t = contact.trim();
  if (!t) return null;
  if (t.length > 200) return null;
  return t;
}

// ─── Validation Schemas (longgarkan websiteUrl, tambah renewal/contact validasi) ─
const AddClientSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  contactInfo: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => validateContact(v ?? "")),
  websiteUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => {
      if (!v) return null;
      const normalized = normalizeUrl(v);
      return normalized;
    })
    .refine((v) => v === null || v === normalizeUrl(v), { message: "URL tidak valid" }),
  renewalDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), { message: "Tanggal tidak valid" }),
  lastNote: z.string().max(500).optional().or(z.literal("")),
});

const UpdateClientSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  contactInfo: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => validateContact(v ?? "")),
  websiteUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => {
      if (!v) return null;
      const normalized = normalizeUrl(v);
      return normalized;
    }),
  renewalDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), { message: "Tanggal tidak valid" }),
  lastNote: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["FOLLOW_UP", "DEAL", "REJECT"]),
});

export type AddClientFormData = z.infer<typeof AddClientSchema>;
export type UpdateClientFormData = z.infer<typeof UpdateClientSchema>;

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ─── Add Client ───────────────────────────────────────────────────────────────
export async function addClient(data: AddClientFormData): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = AddClientSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { name, contactInfo, websiteUrl, renewalDate, lastNote } = parsed.data as {
    name: string;
    contactInfo: string | null;
    websiteUrl: string | null;
    renewalDate: string | null;
    lastNote?: string;
  };

  if (websiteUrl === null && data.websiteUrl && String(data.websiteUrl).trim() !== "") {
    return { success: false, error: "Website URL tidak valid (contoh: okesite.com atau https://okesite.com)" };
  }

  try {
    const [row] = await db
      .insert(clients)
      .values({
        name,
        contactInfo: contactInfo || null,
        websiteUrl: websiteUrl || null,
        renewalDate: renewalDate || null,
        lastNote: lastNote || null,
        status: "FOLLOW_UP",
        updatedAt: new Date().toISOString(),
      })
      .returning({ id: clients.id });

    await logAudit({ userId, action: "CREATE", entity: "clients", entityId: row?.id ?? null, detail: `Add client ${name}` });
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/renewals");
    return { success: true, message: `Lead "${name}" berhasil ditambahkan.` };
  } catch (err) {
    console.error("[addClient] DB error:", err);
    return { success: false, error: "Gagal menyimpan klien. Coba lagi." };
  }
}

// ─── Update Client (full edit) ──────────────────────────────────────────────
export async function updateClient(id: number, data: UpdateClientFormData): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  const parsed = UpdateClientSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { name, contactInfo, websiteUrl, renewalDate, lastNote, status } = parsed.data as {
    name: string;
    contactInfo: string | null;
    websiteUrl: string | null;
    renewalDate: string | null;
    lastNote?: string;
    status: "FOLLOW_UP" | "DEAL" | "REJECT";
  };

  if (websiteUrl === null && data.websiteUrl && String(data.websiteUrl).trim() !== "") {
    return { success: false, error: "Website URL tidak valid" };
  }

  try {
    const [existing] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    if (!existing) return { success: false, error: "Klien tidak ditemukan." };

    await db
      .update(clients)
      .set({
        name,
        contactInfo: contactInfo || null,
        websiteUrl: websiteUrl || null,
        renewalDate: renewalDate || null,
        lastNote: lastNote || null,
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(clients.id, id));

    await logAudit({ userId, action: "UPDATE", entity: "clients", entityId: id, detail: `Update client ${name}` });
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/renewals");
    return { success: true, message: "Klien berhasil diperbarui." };
  } catch (err) {
    console.error("[updateClient] DB error:", err);
    return { success: false, error: "Gagal memperbarui klien." };
  }
}

// ─── Update Client Status ────────────────────────────────────────────────────
export async function updateClientStatus(id: number, status: "FOLLOW_UP" | "DEAL" | "REJECT"): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    await db.update(clients).set({ status, updatedAt: new Date().toISOString() }).where(eq(clients.id, id));
    await logAudit({ userId, action: "UPDATE_STATUS", entity: "clients", entityId: id, detail: `status -> ${status}` });
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: true, message: "Status diperbarui." };
  } catch (err) {
    console.error("[updateClientStatus] DB error:", err);
    return { success: false, error: "Gagal memperbarui status." };
  }
}

// ─── Delete Client (hard-block jika punya invoices) ─────────────────────────
export async function deleteClient(id: number): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const [existing] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    if (!existing) return { success: false, error: "Klien tidak ditemukan." };

    const related = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.clientId, id)).limit(1);
    if (related.length > 0) {
      return {
        success: false,
        error: "Klien tidak bisa dihapus karena masih memiliki tagihan. Hapus atau pindahkan tagihannya terlebih dahulu.",
      };
    }

    await db.delete(clients).where(eq(clients.id, id));
    await logAudit({ userId, action: "DELETE", entity: "clients", entityId: id, detail: `Delete ${existing.name}` });
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard");
    return { success: true, message: "Klien berhasil dihapus." };
  } catch (err) {
    console.error("[deleteClient] DB error:", err);
    return { success: false, error: "Gagal menghapus klien." };
  }
}

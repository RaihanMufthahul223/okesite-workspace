"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────
const ServiceSchema = z.object({
  name: z.string().min(1, "Nama layanan wajib diisi").max(100),
  basePrice: z.coerce
    .number({ message: "Harga harus berupa angka" })
    .positive("Harga harus lebih dari 0"),
  description: z.string().max(500).optional(),
});

export type ServiceFormData = z.infer<typeof ServiceSchema>;

// ─── Action Result Type ───────────────────────────────────────────────────────
export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ─── Add Service ──────────────────────────────────────────────────────────────
export async function addService(
  data: ServiceFormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = ServiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const { name, basePrice, description } = parsed.data;

  try {
    await db.insert(services).values({
      name,
      basePrice,
      description: description || null,
    });

    revalidatePath("/dashboard/services");
    return { success: true, message: `Layanan "${name}" berhasil ditambahkan.` };
  } catch (err) {
    console.error("[addService] DB error:", err);
    return { success: false, error: "Gagal menyimpan layanan. Coba lagi." };
  }
}

// ─── Update Service ───────────────────────────────────────────────────────────
export async function updateService(
  id: number,
  data: ServiceFormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = ServiceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const { name, basePrice, description } = parsed.data;

  try {
    await db
      .update(services)
      .set({
        name,
        basePrice,
        description: description || null,
      })
      .where(eq(services.id, id));

    revalidatePath("/dashboard/services");
    return { success: true, message: `Layanan "${name}" berhasil diperbarui.` };
  } catch (err) {
    console.error("[updateService] DB error:", err);
    return { success: false, error: "Gagal memperbarui layanan. Coba lagi." };
  }
}

// ─── Delete Service ───────────────────────────────────────────────────────────
export async function deleteService(id: number): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.delete(services).where(eq(services.id, id));
    revalidatePath("/dashboard/services");
    return { success: true, message: "Layanan berhasil dihapus." };
  } catch (err) {
    console.error("[deleteService] DB error:", err);
    return { success: false, error: "Gagal menghapus layanan. Coba lagi." };
  }
}

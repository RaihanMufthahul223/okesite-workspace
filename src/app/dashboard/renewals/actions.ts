"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function extendRenewal(
  clientId: number,
  months: number = 12
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const [existing] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!existing) return { success: false, error: "Klien tidak ditemukan" };

    const baseDate = existing.renewalDate ? new Date(existing.renewalDate) : new Date();
    // If overdue, extend from today; if upcoming, extend from renewalDate
    const start = baseDate.getTime() < Date.now() ? new Date() : baseDate;
    const next = new Date(start);
    next.setMonth(next.getMonth() + months);
    const iso = next.toISOString().slice(0, 10);

    await db
      .update(clients)
      .set({ renewalDate: iso, updatedAt: new Date().toISOString() })
      .where(eq(clients.id, clientId));

    revalidatePath("/dashboard/renewals");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");
    return { success: true, message: `Perpanjangan diperbarui ke ${iso}` };
  } catch (err) {
    console.error("[extendRenewal]", err);
    return { success: false, error: "Gagal memperbarui perpanjangan" };
  }
}

export async function updateRenewalDate(
  clientId: number,
  renewalDate: string
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  if (renewalDate && isNaN(new Date(renewalDate).getTime())) {
    return { success: false, error: "Format tanggal tidak valid" };
  }

  try {
    await db
      .update(clients)
      .set({ renewalDate: renewalDate || null, updatedAt: new Date().toISOString() })
      .where(eq(clients.id, clientId));

    revalidatePath("/dashboard/renewals");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");
    return { success: true, message: "Tanggal perpanjangan diperbarui" };
  } catch (err) {
    console.error("[updateRenewalDate]", err);
    return { success: false, error: "Gagal memperbarui tanggal" };
  }
}

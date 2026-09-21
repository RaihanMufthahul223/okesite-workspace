"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────
const AddClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  contactInfo: z.string().max(200).optional(),
  websiteUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  renewalDate: z.string().optional(),
  lastNote: z.string().max(500).optional(),
});

export type AddClientFormData = z.infer<typeof AddClientSchema>;

// ─── Action Result Type ───────────────────────────────────────────────────────
export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ─── Add Client ───────────────────────────────────────────────────────────────
export async function addClient(
  data: AddClientFormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = AddClientSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
    };
  }

  const { name, contactInfo, websiteUrl, renewalDate, lastNote } = parsed.data;

  try {
    await db.insert(clients).values({
      name,
      contactInfo: contactInfo || null,
      websiteUrl: websiteUrl || null,
      renewalDate: renewalDate || null,
      lastNote: lastNote || null,
      status: "FOLLOW_UP",
    });

    revalidatePath("/dashboard/clients");
    return { success: true, message: `Lead "${name}" added successfully.` };
  } catch (err) {
    console.error("[addClient] DB error:", err);
    return { success: false, error: "Failed to save client. Please try again." };
  }
}

// ─── Update Client Status ─────────────────────────────────────────────────────
export async function updateClientStatus(
  id: number,
  status: "FOLLOW_UP" | "DEAL" | "REJECT"
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db
      .update(clients)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(clients.id, id));

    revalidatePath("/dashboard/clients");
    return { success: true, message: "Status updated." };
  } catch (err) {
    console.error("[updateClientStatus] DB error:", err);
    return { success: false, error: "Failed to update status." };
  }
}

// ─── Delete Client ────────────────────────────────────────────────────────────
export async function deleteClient(id: number): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await db.delete(clients).where(eq(clients.id, id));
    revalidatePath("/dashboard/clients");
    return { success: true, message: "Client deleted." };
  } catch (err) {
    console.error("[deleteClient] DB error:", err);
    return { success: false, error: "Failed to delete client." };
  }
}

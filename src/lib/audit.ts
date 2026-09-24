import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  detail?: string | null;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId != null ? String(params.entityId) : null,
      detail: params.detail ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to log", err);
  }
}

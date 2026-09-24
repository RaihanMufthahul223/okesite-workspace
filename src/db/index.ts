import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is not set");
  }
  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN environment variable is not set");
  }

  const client = createClient({ url, authToken });

  // Fire-and-forget lightweight migrations for edge runtime.
  // - Ensure audit_logs exists
  // - Ensure payments.proof_url exists (added 2026-09-24, DB may be stale)
  // We cannot await here (createDb is sync), so use promise chain with error swallow.
  // Subsequent queries will retry after migration via safe helper if needed.
  void (async () => {
    try {
      await client.execute(
        `CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          action TEXT NOT NULL,
          entity TEXT NOT NULL,
          entity_id TEXT,
          detail TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      );
    } catch (e) {
      console.warn("[db migration] audit_logs create failed", e);
    }
    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN proof_url TEXT`);
    } catch (e) {
      // Ignore duplicate column error – Turso/libSQL throws "duplicate column name: proof_url"
      const msg = String((e as Error)?.message ?? "");
      if (!msg.toLowerCase().includes("duplicate column")) {
        console.warn("[db migration] payments proof_url add failed", msg);
      }
    }
  })();

  return drizzle(client, { schema });
}

// Export a singleton db instance
export const db = createDb();
export type DB = typeof db;

// Helper for resilient payments select – falls back if proof_url missing (DB stale before migration)
export async function safeSelectPayments() {
  try {
    return await db.select().from(schema.payments);
  } catch (e) {
    const msg = String((e as Error)?.message ?? "");
    if (msg.includes("proof_url") || msg.includes("no such column")) {
      console.warn("[safeSelectPayments] fallback without proof_url", msg);
      // Raw query without proof_url
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });
      const rs = await client.execute(
        `SELECT id, invoice_id as invoiceId, amount_paid as amountPaid, payment_date as paymentDate, payment_method as paymentMethod, note FROM payments`
      );
      return rs.rows.map((r: Record<string, unknown>) => ({
        id: Number(r.id),
        invoiceId: Number(r.invoiceId),
        amountPaid: Number(r.amountPaid),
        paymentDate: (r.paymentDate as string) ?? null,
        paymentMethod: (r.paymentMethod as string) ?? null,
        note: (r.note as string) ?? null,
        proofUrl: null,
      })) as unknown as (typeof schema.payments.$inferSelect)[];
    }
    throw e;
  }
}

import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── services ───────────────────────────────────────────────────────────────
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  basePrice: real("base_price").notNull(),
  description: text("description"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── clients ────────────────────────────────────────────────────────────────
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  status: text("status", { enum: ["FOLLOW_UP", "DEAL", "REJECT"] })
    .default("FOLLOW_UP")
    .notNull(),
  lastNote: text("last_note"),
  websiteUrl: text("website_url"),
  renewalDate: text("renewal_date"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── invoices ───────────────────────────────────────────────────────────────
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  totalAmount: real("total_amount").notNull(),
  status: text("status", { enum: ["UNPAID", "PARTIAL", "PAID"] })
    .default("UNPAID")
    .notNull(),
  dueDate: text("due_date"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── payments ───────────────────────────────────────────────────────────────
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  amountPaid: real("amount_paid").notNull(),
  paymentDate: text("payment_date"),
  paymentMethod: text("payment_method"),
  note: text("note"),
  proofUrl: text("proof_url"),
});

// ─── audit_logs ─────────────────────────────────────────────────────────────
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  detail: text("detail"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── Types ───────────────────────────────────────────────────────────────────
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

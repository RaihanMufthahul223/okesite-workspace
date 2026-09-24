export const runtime = "edge";

import { db, safeSelectPayments } from "@/db";
import { invoices, clients, services } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { CreateInvoiceDialog } from "./InvoiceDialogs";
import { InvoiceListContainer } from "./InvoiceListContainer";
import { FileText, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tagihan — OkeSite CRM",
  description: "Kelola tagihan dan pembayaran klien",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function InvoicesPage() {
  const [allInvoices, dealClients, allServices] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.status, "DEAL")),
    db.select({ id: services.id, name: services.name, basePrice: services.basePrice }).from(services),
  ]);

  const [clientRows, serviceRows, paymentRows] = await Promise.all([
    db.select({ id: clients.id, name: clients.name }).from(clients),
    db.select({ id: services.id, name: services.name }).from(services),
    safeSelectPayments(),
  ]);

  const clientMap = new Map(clientRows.map((c) => [c.id, c.name]));
  const serviceMap = new Map(serviceRows.map((s) => [s.id, s.name]));

  const paidMap = new Map<number, number>();
  for (const p of paymentRows) {
    paidMap.set(p.invoiceId, (paidMap.get(p.invoiceId) ?? 0) + p.amountPaid);
  }

  const enriched = allInvoices.map((inv) => {
    const paidTotal = paidMap.get(inv.id) ?? 0;
    const remaining = Math.max(0, inv.totalAmount - paidTotal);
    return {
      ...inv,
      clientName: clientMap.get(inv.clientId) ?? `Klien #${inv.clientId}`,
      serviceName: serviceMap.get(inv.serviceId) ?? `Layanan #${inv.serviceId}`,
      paidTotal,
      remaining,
    };
  });

  const totalCount = enriched.length;
  const paidCount = enriched.filter((i) => i.status === "PAID").length;
  const unpaidCount = enriched.filter((i) => i.status !== "PAID").length;
  const outstandingAmount = enriched.reduce((sum, i) => sum + i.remaining, 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Daftar Tagihan
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola tagihan invoice, cicilan pembayaran, dan piutang klien.
          </p>
        </div>
        <CreateInvoiceDialog dealClients={dealClients} services={allServices} />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Tagihan
            </p>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</p>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Lunas
            </p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{paidCount}</p>
        </div>

        <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Pending / Partial
            </p>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{unpaidCount}</p>
        </div>

        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Piutang Belum Lunas
            </p>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-blue-700 mt-2 truncate">
            {formatCurrency(outstandingAmount)}
          </p>
        </div>
      </div>

      {/* Interactive Invoice List Container */}
      <InvoiceListContainer
        invoices={enriched}
        dealClients={dealClients}
        services={allServices}
      />
    </div>
  );
}


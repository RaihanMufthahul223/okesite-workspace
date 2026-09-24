
import { db } from "@/db";
import { services } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AddServiceDialog } from "./ServiceDialogs";
import { ServiceListContainer } from "./ServiceListContainer";
import { Package, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Layanan — OkeSite CRM",
  description: "Kelola paket dan layanan agensi",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ServicesPage() {
  const allServices = await db
    .select()
    .from(services)
    .orderBy(desc(services.createdAt));

  const averagePrice =
    allServices.length > 0
      ? allServices.reduce((sum, s) => sum + s.basePrice, 0) / allServices.length
      : 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Layanan &amp; Paket Agensi
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola daftar layanan, paket produk, dan tarif dasar agensi Anda.
          </p>
        </div>
        <AddServiceDialog />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Paket Layanan
            </p>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {allServices.length}
          </p>
        </div>

        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Rata-Rata Harga Paket
            </p>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {allServices.length > 0 ? formatCurrency(averagePrice) : "Rp 0"}
          </p>
        </div>
      </div>

      {/* Interactive Service List Container */}
      <ServiceListContainer services={allServices} />
    </div>
  );
}


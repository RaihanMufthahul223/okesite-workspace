export const runtime = "edge";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AddClientDialog } from "./AddClientDialog";
import { ClientListContainer } from "./ClientListContainer";
import { Users, CheckCircle, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clients & Leads — OkeSite CRM",
  description: "Kelola prospek, klien aktif, dan tanggal perpanjangan",
};

export default async function ClientsPage() {
  const allClients = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));

  const total = allClients.length;
  const deals = allClients.filter((c) => c.status === "DEAL").length;
  const followUps = allClients.filter((c) => c.status === "FOLLOW_UP").length;
  const rejects = allClients.filter((c) => c.status === "REJECT").length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Daftar Klien &amp; Prospek
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola prospek, klien aktif, catatan interaksi, dan perpanjangan domain.
          </p>
        </div>
        <AddClientDialog />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Prospek
            </p>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{total}</p>
        </div>

        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Active Deals
            </p>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{deals}</p>
        </div>

        <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Follow Up
            </p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{followUps}</p>
        </div>

        <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Rejected
            </p>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{rejects}</p>
        </div>
      </div>

      {/* Interactive Client List Container */}
      <ClientListContainer initialClients={allClients} />
    </div>
  );
}



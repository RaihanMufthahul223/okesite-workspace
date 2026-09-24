
import { db } from "@/db";
import { clients } from "@/db/schema";
import { desc } from "drizzle-orm";
import { RenewalListContainer } from "./RenewalListContainer";
import { getRenewalInfo } from "@/lib/renewal";
import { CalendarClock, AlertTriangle, Clock, CalendarCheck, History } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengingat Renewal — OkeSite CRM",
  description: "Pantau jadwal perpanjangan domain & hosting klien",
};

export default async function RenewalsPage() {
  const allClients = await db.select().from(clients).orderBy(desc(clients.createdAt));

  const enriched = allClients.map((c) => ({ ...c, info: getRenewalInfo(c.renewalDate) }));

  const totalTracked = enriched.filter((c) => c.renewalDate !== null).length;
  const overdue = enriched.filter((c) => c.info.category === "OVERDUE").length;
  const today = enriched.filter((c) => c.info.category === "TODAY").length;
  const upcoming7 = enriched.filter((c) => c.info.daysUntil !== null && c.info.daysUntil >= 0 && c.info.daysUntil <= 7).length;
  const upcoming14 = enriched.filter((c) => c.info.daysUntil !== null && c.info.daysUntil >= 0 && c.info.daysUntil <= 14).length;
  const upcoming30 = enriched.filter((c) => c.info.daysUntil !== null && c.info.daysUntil >= 0 && c.info.daysUntil <= 30).length;
  const noDate = enriched.filter((c) => c.info.category === "NO_DATE").length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-blue-600" />
          Pengingat Renewal
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pantau jadwal perpanjangan domain & hosting. Segera hubungi klien yang mendekati jatuh tempo.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Terpantau</p>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalTracked}</p>
          <p className="text-xs text-slate-400 mt-1">dari {allClients.length} klien</p>
        </div>

        <div className="bg-rose-50/60 rounded-2xl border border-rose-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Terlambat</p>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{overdue}</p>
          <p className="text-xs text-rose-600/70 mt-1">Perlu tindakan segera</p>
        </div>

        <div className="bg-rose-50/40 rounded-2xl border border-rose-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Hari Ini</p>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{today}</p>
        </div>

        <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">≤ 7 Hari</p>
            <CalendarClock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{upcoming7}</p>
        </div>

        <div className="bg-amber-50/40 rounded-2xl border border-amber-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">≤ 14 Hari</p>
            <CalendarCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{upcoming14}</p>
        </div>

        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">≤ 30 Hari</p>
            <CalendarClock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">{upcoming30}</p>
          <p className="text-xs text-blue-600/70 mt-1">{noDate} tanpa tanggal</p>
        </div>
      </div>

      {/* Urgency Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-slate-700">Legenda:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Terlambat / Hari ini / ≤7 hari
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 8–30 hari
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 31–60 hari
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> &gt;60 hari / tanpa tanggal
        </span>
      </div>

      {/* List */}
      <RenewalListContainer initialClients={allClients} />
    </div>
  );
}

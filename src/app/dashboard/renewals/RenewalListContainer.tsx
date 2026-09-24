"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Filter,
  Calendar,
  ExternalLink,
  PhoneCall,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  MessageCircle,
  RefreshCw,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@/db/schema";
import { getRenewalInfo, formatRenewalDate, buildWhatsAppLink, type RenewalCategory } from "@/lib/renewal";
import { extendRenewal } from "./actions";

type EnrichedClient = Client & { renewalInfo: ReturnType<typeof getRenewalInfo> };

const categoryFilterOptions: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Semua" },
  { value: "OVERDUE", label: "Terlambat" },
  { value: "TODAY", label: "Hari ini" },
  { value: "UPCOMING_7", label: "≤ 7 hari" },
  { value: "UPCOMING_14", label: "≤ 14 hari" },
  { value: "UPCOMING_30", label: "≤ 30 hari" },
  { value: "NO_DATE", label: "Tanpa tanggal" },
];

function StatusBadge({ category, label }: { category: RenewalCategory; label: string }) {
  let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
  if (category === "OVERDUE" || category === "TODAY" || category === "UPCOMING_7") badgeClass = "bg-rose-100 text-rose-700 border-rose-200";
  else if (category === "UPCOMING_14" || category === "UPCOMING_30") badgeClass = "bg-amber-100 text-amber-700 border-amber-200";
  else if (category === "UPCOMING_60") badgeClass = "bg-blue-100 text-blue-700 border-blue-200";

  const Icon =
    category === "OVERDUE" ? AlertTriangle : category === "TODAY" ? Clock : category === "NO_DATE" ? History : CalendarClock;

  return (
    <Badge variant="outline" className={`text-xs font-semibold gap-1 ${badgeClass}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

export function RenewalListContainer({ initialClients }: { initialClients: Client[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [extendingId, setExtendingId] = useState<number | null>(null);

  const enriched: EnrichedClient[] = useMemo(() => {
    return initialClients
      .map((c) => ({ ...c, renewalInfo: getRenewalInfo(c.renewalDate) }))
      .sort((a, b) => {
        if (a.renewalInfo.urgency !== b.renewalInfo.urgency) return a.renewalInfo.urgency - b.renewalInfo.urgency;
        if (!a.renewalDate && !b.renewalDate) return 0;
        if (!a.renewalDate) return 1;
        if (!b.renewalDate) return -1;
        return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
      });
  }, [initialClients]);

  const filtered = useMemo(() => {
    return enriched.filter((c) => {
      // category filter
      if (categoryFilter !== "ALL") {
        if (categoryFilter === "UPCOMING_7") {
          if (!(c.renewalInfo.daysUntil !== null && c.renewalInfo.daysUntil >= 0 && c.renewalInfo.daysUntil <= 7)) {
            // include OVERDUE/TODAY as part of urgent 7?
            if (c.renewalInfo.category !== "OVERDUE" && c.renewalInfo.category !== "TODAY") return false;
          }
          // Actually simpler: use category exact for filter options except UPCOMING_7 includes TODAY+OVERDUE is not desired for filter clarity.
          // We'll do explicit mapping:
          const is7 = c.renewalInfo.category === "UPCOMING_7" || c.renewalInfo.category === "TODAY";
          const isOverdue = c.renewalInfo.category === "OVERDUE";
          // For UPCOMING_7 tab we show TODAY + 7 but not overdue, to keep overdue separate.
          if (!(is7 || (categoryFilter === "UPCOMING_7" && c.renewalInfo.category === "UPCOMING_7"))) return false;
          // Re-evaluate: simpler to just allow any within 0-7 inclusive
          const d = c.renewalInfo.daysUntil;
          if (d === null || d < 0 || d > 7) return false;
        } else if (categoryFilter === "UPCOMING_14") {
          const d = c.renewalInfo.daysUntil;
          if (d === null || d < 0 || d > 14) return false;
        } else if (categoryFilter === "UPCOMING_30") {
          const d = c.renewalInfo.daysUntil;
          if (d === null || d < 0 || d > 30) return false;
        } else if (c.renewalInfo.category !== categoryFilter) {
          return false;
        }
      }
      // status filter (DEAL etc)
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.contactInfo || "").toLowerCase().includes(q) ||
          (c.websiteUrl || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enriched, categoryFilter, statusFilter, searchQuery]);

  async function handleExtend(client: EnrichedClient, months: number) {
    setExtendingId(client.id);
    const res = await extendRenewal(client.id, months);
    setExtendingId(null);
    if (res.success) toast.success(res.message);
    else toast.error(res.error);
  }

  return (
    <div className="space-y-6">
      {/* ── Search & Filter Controls ── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama klien, kontak, atau website..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="ALL">Semua Status</option>
              <option value="DEAL">DEAL</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="REJECT">Reject</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categoryFilterOptions.map((opt) => {
            const active = categoryFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategoryFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
            {filtered.length} dari {enriched.length}
          </span>
        </div>
      </div>

      {/* ── Data Display ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-slate-900 font-bold text-base">Tidak ada pengingat</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Tidak ada klien yang cocok dengan filter. Coba ubah pencarian atau filter kategori.
          </p>
          <div className="mt-5">
            <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
              Kelola klien <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50">
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider pl-6">Klien</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Website</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Perpanjangan</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const waLink = buildWhatsAppLink(c.name, c.websiteUrl, c.renewalDate, c.contactInfo);
                  const isOverdue = c.renewalInfo.category === "OVERDUE";
                  return (
                    <TableRow key={c.id} className={`border-slate-100 hover:bg-slate-50/80 transition-colors ${isOverdue ? "bg-rose-50/30" : ""}`}>
                      <TableCell className="pl-6 py-4">
                        <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <PhoneCall className="w-3 h-3 text-slate-400" />
                          {c.contactInfo || "Tanpa kontak"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {c.websiteUrl ? (
                          <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm hover:underline">
                            <ExternalLink className="w-3.5 h-3.5" />
                            {(() => { try { return new URL(c.websiteUrl).hostname; } catch { return c.websiteUrl; } })()}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`text-sm font-semibold flex items-center gap-1.5 ${isOverdue ? "text-rose-600" : c.renewalInfo.category === "TODAY" ? "text-rose-600" : c.renewalInfo.daysUntil !== null && c.renewalInfo.daysUntil <= 14 ? "text-amber-600" : "text-slate-700"}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {formatRenewalDate(c.renewalDate)}
                          </span>
                          <span className="text-xs mt-0.5">
                            <StatusBadge category={c.renewalInfo.category} label={c.renewalInfo.label} />
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs font-semibold ${c.status === "DEAL" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : c.status === "FOLLOW_UP" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>
                          {c.status === "DEAL" ? "Deal" : c.status === "FOLLOW_UP" ? "Follow Up" : "Reject"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WA
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleExtend(c, 12)}
                            disabled={extendingId === c.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 transition"
                            title="Perpanjang 12 bulan"
                          >
                            {extendingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            +12 bln
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => {
              const waLink = buildWhatsAppLink(c.name, c.websiteUrl, c.renewalDate, c.contactInfo);
              const isOverdue = c.renewalInfo.category === "OVERDUE";
              return (
                <div key={c.id} className={`rounded-2xl border p-4 shadow-xs space-y-3 ${isOverdue ? "bg-rose-50/50 border-rose-200" : "bg-white border-slate-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-base truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <PhoneCall className="w-3 h-3" />
                        {c.contactInfo || "Tanpa kontak"}
                      </p>
                      {c.websiteUrl && (
                        <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                          <ExternalLink className="w-3 h-3" />
                          {(() => { try { return new URL(c.websiteUrl).hostname; } catch { return c.websiteUrl; } })()}
                        </a>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs font-semibold shrink-0 ${c.status === "DEAL" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : c.status === "FOLLOW_UP" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>
                      {c.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Perpanjangan
                      </p>
                      <p className={`text-sm font-bold mt-0.5 ${isOverdue ? "text-rose-600" : "text-slate-900"}`}>{formatRenewalDate(c.renewalDate)}</p>
                    </div>
                    <StatusBadge category={c.renewalInfo.category} label={c.renewalInfo.label} />
                  </div>

                  <div className="flex items-center gap-2">
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition">
                        <MessageCircle className="w-4 h-4" />
                        Ingatkan via WA
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleExtend(c, 12)}
                      disabled={extendingId === c.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50"
                    >
                      {extendingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Perpanjang 1 th
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import type { Client } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Users, ExternalLink, Calendar, ChevronRight, PhoneCall } from "lucide-react";
import { ClientDetailSheet } from "./ClientDetailSheet";
import { AddClientDialog } from "./AddClientDialog";

const statusConfig = {
  FOLLOW_UP: {
    label: "Follow Up",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  DEAL: {
    label: "Deal",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECT: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  },
} as const;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isRenewalSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
}

interface ClientListContainerProps {
  initialClients: Client[];
}

export function ClientListContainer({ initialClients }: ClientListContainerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredClients = useMemo(() => {
    return initialClients.filter((client) => {
      // Status filter
      if (statusFilter !== "ALL" && client.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const nameMatch = client.name.toLowerCase().includes(q);
        const contactMatch = (client.contactInfo || "").toLowerCase().includes(q);
        const websiteMatch = (client.websiteUrl || "").toLowerCase().includes(q);
        return nameMatch || contactMatch || websiteMatch;
      }
      return true;
    });
  }, [initialClients, statusFilter, searchQuery]);

  function handleRowClick(client: Client) {
    setSelectedClient(client);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search input */}
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

        {/* Status filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          >
            <option value="ALL">Semua Status</option>
            <option value="DEAL">Deal (Aktif)</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="REJECT">Rejected</option>
          </select>
        </div>
      </div>

      {/* ── Data Display Area ── */}
      {filteredClients.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-slate-900 font-bold text-base">Belum ada klien</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "Tidak ada data klien yang cocok dengan pencarian atau filter Anda."
              : "Belum ada prospek tercatat. Tambahkan prospek pertama Anda."}
          </p>
          <div className="mt-5 flex justify-center">
            <AddClientDialog />
          </div>
        </div>
      ) : (
        <>
          {/* ── Desktop Data Table View (>= 768px) ── */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table id="clients-table">
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50">
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider pl-6">
                    Nama Klien
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Kontak
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Website
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Perpanjangan
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider pr-6 text-right">
                    Detail
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const status = statusConfig[client.status];
                  const renewalSoon = isRenewalSoon(client.renewalDate);

                  return (
                    <TableRow
                      key={client.id}
                      onClick={() => handleRowClick(client)}
                      className="border-slate-100 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      {/* Name */}
                      <TableCell className="pl-6 py-4">
                        <span className="font-semibold text-slate-900 block">
                          {client.name}
                        </span>
                        {client.lastNote && (
                          <span className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {client.lastNote}
                          </span>
                        )}
                      </TableCell>

                      {/* Contact */}
                      <TableCell className="text-slate-600 text-sm">
                        {client.contactInfo || "—"}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>

                      {/* Website */}
                      <TableCell>
                        {client.websiteUrl ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm">
                            <ExternalLink className="w-3.5 h-3.5" />
                            {new URL(client.websiteUrl).hostname}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </TableCell>

                      {/* Renewal Date */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {client.renewalDate && (
                            <Calendar
                              className={`w-3.5 h-3.5 flex-shrink-0 ${
                                renewalSoon ? "text-rose-500" : "text-slate-400"
                              }`}
                            />
                          )}
                          <span
                            className={`text-sm ${
                              renewalSoon ? "text-rose-600 font-semibold" : "text-slate-600"
                            }`}
                          >
                            {formatDate(client.renewalDate)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Action Icon */}
                      <TableCell className="pr-6 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── Mobile Card List View (< 768px) ── */}
          <div className="md:hidden space-y-3">
            {filteredClients.map((client) => {
              const status = statusConfig[client.status];
              const renewalSoon = isRenewalSoon(client.renewalDate);

              return (
                <div
                  key={client.id}
                  onClick={() => handleRowClick(client)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all cursor-pointer active:bg-slate-50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{client.name}</h4>
                      {client.contactInfo && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <PhoneCall className="w-3 h-3 text-slate-400" />
                          {client.contactInfo}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                    {client.websiteUrl ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                        <ExternalLink className="w-3 h-3" />
                        {new URL(client.websiteUrl).hostname}
                      </span>
                    ) : (
                      <span className="text-slate-400">Tanpa Website</span>
                    )}

                    {client.renewalDate && (
                      <span className={`inline-flex items-center gap-1 ${renewalSoon ? "text-rose-600 font-semibold" : "text-slate-500"}`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(client.renewalDate)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Client Detail Slide-Over Sheet ── */}
      <ClientDetailSheet
        client={selectedClient}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

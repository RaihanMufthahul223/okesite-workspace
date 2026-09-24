"use client";

import { useState, useMemo } from "react";
import type { Client } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Users, ExternalLink, Calendar, ChevronRight, PhoneCall, Download, Upload } from "lucide-react";
import { ClientDetailSheet } from "./ClientDetailSheet";
import { AddClientDialog } from "./AddClientDialog";
import { Pagination, SortButton } from "@/components/Pagination";
import { toast } from "sonner";
import { addClient } from "./actions";

const statusConfig = {
  FOLLOW_UP: { label: "Follow Up", className: "bg-amber-100 text-amber-700 border-amber-200" },
  DEAL: { label: "Deal", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  REJECT: { label: "Rejected", className: "bg-rose-100 text-rose-700 border-rose-200" },
} as const;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
function isRenewalSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const diff = d.getTime() - new Date().getTime();
  return diff / (1000 * 60 * 60 * 24) >= 0 && diff / (1000 * 60 * 60 * 24) <= 30;
}

export function ClientListContainer({ initialClients }: { initialClients: Client[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "renewalDate">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir(col === "name" ? "asc" : "desc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let rows = initialClients.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.contactInfo || "").toLowerCase().includes(q) || (c.websiteUrl || "").toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "renewalDate") cmp = (a.renewalDate || "").localeCompare(b.renewalDate || "");
      else cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [initialClients, statusFilter, searchQuery, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleRowClick(c: Client) {
    setSelectedClient(c);
    setSheetOpen(true);
  }

  function handleExportCsv() {
    const header = ["id","name","contact_info","status","website_url","renewal_date","last_note","created_at"];
    const rows = filtered.map((c) => [c.id, `"${c.name.replace(/"/g, '""')}"`, `"${(c.contactInfo||"").replace(/"/g,'""')}"`, c.status, c.websiteUrl||"", c.renewalDate||"", `"${(c.lastNote||"").replace(/"/g,'""')}"`, c.createdAt||""].join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `klien-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV klien diekspor");
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    if (lines.length < 2) { toast.error("CSV kosong"); return; }
    const dataLines = lines.slice(1);
    let added = 0;
    for (const line of dataLines) {
      const parts = line.split(",");
      const name = parts[1]?.replace(/^"|"$/g, "").replace(/""/g, '"').trim();
      if (!name) continue;
      const contact = parts[2]?.replace(/^"|"$/g, "").replace(/""/g, '"') || "";
      const status = (parts[3]?.trim() as Client["status"]) || "FOLLOW_UP";
      const website = parts[4]?.trim() || "";
      const renewal = parts[5]?.trim() || "";
      const note = parts[6]?.replace(/^"|"$/g, "").replace(/""/g, '"') || "";
      const res = await addClient({ name, contactInfo: contact, websiteUrl: website, renewalDate: renewal, lastNote: note });
      if (res.success) added++;
    }
    toast.success(`${added} klien diimpor`);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Cari nama klien, kontak, atau website..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all">
            <option value="ALL">Semua Status</option>
            <option value="DEAL">Deal (Aktif)</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="REJECT">Rejected</option>
          </select>
          <button type="button" onClick={handleExportCsv} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600" title="Export CSV">
            <Download className="w-4 h-4" />
          </button>
          <label className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer" title="Import CSV">
            <Upload className="w-4 h-4" />
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-slate-900 font-bold text-base">Belum ada klien</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">{searchQuery || statusFilter !== "ALL" ? "Tidak ada data klien yang cocok dengan pencarian atau filter Anda." : "Belum ada prospek tercatat. Tambahkan prospek pertama Anda."}</p>
          <div className="mt-5 flex justify-center">
            <AddClientDialog />
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table id="clients-table">
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50">
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider pl-6">
                    <SortButton active={sortBy==="name"} dir={sortDir} onClick={()=>toggleSort("name")}>Nama Klien</SortButton>
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Kontak</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Website</TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <SortButton active={sortBy==="renewalDate"} dir={sortDir} onClick={()=>toggleSort("renewalDate")}>Perpanjangan</SortButton>
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider pr-6 text-right">
                    <SortButton active={sortBy==="createdAt"} dir={sortDir} onClick={()=>toggleSort("createdAt")}>Detail</SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((client) => {
                  const status = statusConfig[client.status];
                  const renewalSoon = isRenewalSoon(client.renewalDate);
                  return (
                    <TableRow key={client.id} onClick={() => handleRowClick(client)} className="border-slate-100 hover:bg-blue-50/40 cursor-pointer transition-colors">
                      <TableCell className="pl-6 py-4">
                        <span className="font-semibold text-slate-900 block">{client.name}</span>
                        {client.lastNote && <span className="text-xs text-slate-400 line-clamp-1 mt-0.5">{client.lastNote}</span>}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">{client.contactInfo || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-xs font-semibold ${status.className}`}>{status.label}</Badge></TableCell>
                      <TableCell>{client.websiteUrl ? <span className="inline-flex items-center gap-1 text-blue-600 font-medium text-sm"><ExternalLink className="w-3.5 h-3.5" />{(() => { try { return new URL(client.websiteUrl!).hostname; } catch { return client.websiteUrl; } })()}</span> : <span className="text-slate-300 text-sm">—</span>}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {client.renewalDate && <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${renewalSoon ? "text-rose-500" : "text-slate-400"}`} />}
                          <span className={`text-sm ${renewalSoon ? "text-rose-600 font-semibold" : "text-slate-600"}`}>{formatDate(client.renewalDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right"><ChevronRight className="w-4 h-4 text-slate-400 inline-block" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {paged.map((client) => {
              const status = statusConfig[client.status];
              const renewalSoon = isRenewalSoon(client.renewalDate);
              return (
                <div key={client.id} onClick={() => handleRowClick(client)} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all cursor-pointer active:bg-slate-50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{client.name}</h4>
                      {client.contactInfo && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><PhoneCall className="w-3 h-3 text-slate-400" />{client.contactInfo}</p>}
                    </div>
                    <Badge variant="outline" className={`text-xs font-semibold ${status.className}`}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                    {client.websiteUrl ? <span className="inline-flex items-center gap-1 text-blue-600 font-medium"><ExternalLink className="w-3 h-3" />{(() => { try { return new URL(client.websiteUrl!).hostname; } catch { return client.websiteUrl; } })()}</span> : <span className="text-slate-400">Tanpa Website</span>}
                    {client.renewalDate && <span className={`inline-flex items-center gap-1 ${renewalSoon ? "text-rose-600 font-semibold" : "text-slate-500"}`}><Calendar className="w-3 h-3" />{formatDate(client.renewalDate)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} />
        </>
      )}

      <ClientDetailSheet client={selectedClient} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentDialog, EditInvoiceDialog, DeleteInvoiceButton } from "./InvoiceDialogs";
import { Search, Filter, FileText, Calendar, Wallet } from "lucide-react";
import { CreateInvoiceDialog } from "./InvoiceDialogs";

const statusConfig = {
  UNPAID: { label: "Belum Bayar", className: "bg-rose-100 text-rose-700 border-rose-200" },
  PARTIAL: { label: "Cicil", className: "bg-amber-100 text-amber-700 border-amber-200" },
  PAID: { label: "Lunas", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
} as const;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type EnrichedInvoice = {
  id: number;
  clientId: number;
  serviceId: number;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string | null;
  clientName: string;
  serviceName: string;
  paidTotal: number;
  remaining: number;
};

interface InvoiceListContainerProps {
  invoices: EnrichedInvoice[];
  dealClients: { id: number; name: string }[];
  services: { id: number; name: string; basePrice: number }[];
}

export function InvoiceListContainer({
  invoices,
  dealClients,
  services,
}: InvoiceListContainerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const clientMatch = inv.clientName.toLowerCase().includes(q);
        const serviceMatch = inv.serviceName.toLowerCase().includes(q);
        return clientMatch || serviceMatch;
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama klien atau layanan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          >
            <option value="ALL">Semua Status</option>
            <option value="UNPAID">Belum Dibayar</option>
            <option value="PARTIAL">Cicil (Partial)</option>
            <option value="PAID">Lunas</option>
          </select>
        </div>
      </div>

      {/* ── Data Display Area ── */}
      {filteredInvoices.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-slate-900 font-bold text-base">Belum ada tagihan</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "Tidak ada tagihan yang cocok dengan pencarian atau filter Anda."
              : "Belum ada tagihan dibuat. Buat tagihan pertama Anda."}
          </p>
          <div className="mt-5 flex justify-center">
            <CreateInvoiceDialog dealClients={dealClients} services={services} />
          </div>
        </div>
      ) : (
        <>
          {/* ── Desktop Data Table View (>= 768px) ── */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table id="invoices-table">
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50">
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider pl-6">
                    Klien
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Layanan
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Total
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Terbayar
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Sisa
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Jatuh Tempo
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider text-right pr-6">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const status =
                    statusConfig[inv.status as keyof typeof statusConfig] ??
                    statusConfig.UNPAID;

                  return (
                    <TableRow
                      key={inv.id}
                      id={`invoice-row-${inv.id}`}
                      className="border-slate-100 hover:bg-slate-50/80 transition-colors"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">
                            {inv.clientName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm max-w-[180px] truncate">
                        {inv.serviceName}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.totalAmount)}
                      </TableCell>
                      <TableCell className="text-emerald-600 font-semibold text-sm">
                        {formatCurrency(inv.paidTotal)}
                      </TableCell>
                      <TableCell className="text-rose-600 font-semibold text-sm">
                        {formatCurrency(inv.remaining)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(inv.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PaymentDialog invoice={inv} />
                          <EditInvoiceDialog invoice={inv} dealClients={dealClients} services={services} />
                          <DeleteInvoiceButton id={inv.id} clientName={inv.clientName} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── Mobile Card List View (< 768px) ── */}
          <div className="md:hidden space-y-3">
            {filteredInvoices.map((inv) => {
              const status =
                statusConfig[inv.status as keyof typeof statusConfig] ??
                statusConfig.UNPAID;
              const progress =
                inv.totalAmount > 0
                  ? Math.round((inv.paidTotal / inv.totalAmount) * 100)
                  : 0;

              return (
                <div
                  key={inv.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-base truncate">
                        {inv.clientName}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {inv.serviceName}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold shrink-0 ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount)}
                    </p>
                    <div className="flex items-center justify-between text-xs mt-1.5 font-medium">
                      <span className="text-emerald-600">
                        Terbayar {formatCurrency(inv.paidTotal)}
                      </span>
                      <span className="text-rose-600">
                        Sisa {formatCurrency(inv.remaining)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2.5 h-2 w-full bg-slate-200/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1 text-right">
                      {progress}% terbayar
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {inv.dueDate ? `Jt. Tempo ${formatDate(inv.dueDate)}` : "Tanpa Jatuh Tempo"}
                    </span>
                    <div className="flex items-center gap-1">
                      <PaymentDialog invoice={inv} />
                      <EditInvoiceDialog invoice={inv} dealClients={dealClients} services={services} />
                      <DeleteInvoiceButton id={inv.id} clientName={inv.clientName} />
                    </div>
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

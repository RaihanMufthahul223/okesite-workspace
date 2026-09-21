"use client";

import { useState, useMemo } from "react";
import type { Service } from "@/db/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditServiceDialog, AddServiceDialog } from "./ServiceDialogs";
import { DeleteServiceButton } from "./DeleteServiceButton";
import { Search, Package, Calendar } from "lucide-react";

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

interface ServiceListContainerProps {
  services: Service[];
}

export function ServiceListContainer({ services }: ServiceListContainerProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama layanan atau deskripsi..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Content Area */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-slate-900 font-bold text-base">Belum ada layanan</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Tidak ada layanan yang cocok dengan pencarian Anda."
              : "Tambahkan paket layanan pertama agensi Anda."}
          </p>
          <div className="mt-5 flex justify-center">
            <AddServiceDialog />
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View (<768px) */}
          <div className="md:hidden space-y-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-base truncate">
                      {service.name}
                    </p>
                    <p className="text-lg font-extrabold text-blue-600 mt-1">
                      {formatCurrency(service.basePrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <EditServiceDialog service={service} />
                    <DeleteServiceButton id={service.id} name={service.name} />
                  </div>
                </div>
                {service.description && (
                  <p className="text-slate-600 text-sm line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <Calendar className="w-3.5 h-3.5" />
                  Dibuat {formatDate(service.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>=768px) */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Table id="services-table">
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50">
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider pl-6">
                    Nama Layanan
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Harga Dasar
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Deskripsi
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    Tanggal Dibuat
                  </TableHead>
                  <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-wider text-right pr-6">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow
                    key={service.id}
                    id={`service-row-${service.id}`}
                    className="border-slate-100 hover:bg-slate-50/80 transition-colors"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-slate-900 text-sm">
                          {service.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-sm">
                      {formatCurrency(service.basePrice)}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-slate-600 text-sm truncate">
                        {service.description || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {formatDate(service.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EditServiceDialog service={service} />
                        <DeleteServiceButton
                          id={service.id}
                          name={service.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

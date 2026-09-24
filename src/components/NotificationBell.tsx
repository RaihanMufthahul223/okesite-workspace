"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, CalendarClock, FileText, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type RenewalItem = { name: string; renewalDate: string | null };
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ overdue: number; dueToday: number; upcoming7: number; pendingInvoices: number; list: Array<{ id: number; name: string; renewalDate: string | null; websiteUrl: string | null }> } | null>(null);

  useEffect(() => {
    fetch("/api/renewals", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const clients: Array<{ id: number; name: string; renewalDate: string | null; websiteUrl: string | null; renewalInfo: { category: string; daysUntil: number | null } }> = d.clients || [];
        const summary = d.summary as { overdue: number; today: number; upcoming7: number };
        // also fetch invoices pending count via search or assume summary from clients
        fetch("/api/search?q=", { cache: "no-store" })
          .then(() => {
            // fallback: count pending invoices via previously fetched? For now use 0 and fetch renewals summary
          })
          .catch(() => {});
        setData({
          overdue: summary?.overdue ?? 0,
          dueToday: summary?.today ?? 0,
          upcoming7: summary?.upcoming7 ?? 0,
          pendingInvoices: 0,
          list: clients.slice(0, 6).map((c) => ({ id: c.id, name: c.name, renewalDate: c.renewalDate, websiteUrl: c.websiteUrl })),
        });
      })
      .catch(() => {});
  }, [open]);

  const total = (data?.overdue ?? 0) + (data?.dueToday ?? 0) + (data?.upcoming7 ?? 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
        aria-label="Notifikasi"
      >
        <Bell className="w-4 h-4" />
        {total > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white">{total > 9 ? "9+" : total}</span>}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-[420px]">
          <SheetHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="flex flex-col gap-1.5">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Notifikasi
              </SheetTitle>
              <SheetDescription>Renewal & tagihan yang perlu perhatian</SheetDescription>
            </div>
            <SheetClose
              render={
                <button
                  type="button"
                  aria-label="Tutup notifikasi"
                  className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:bg-slate-100 transition md:h-8 md:w-8"
                />
              }
            >
              <X className="w-5 h-5 md:w-4 md:h-4" />
            </SheetClose>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!data ? (
              <p className="text-sm text-slate-500 text-center py-8">Memuat...</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                    <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Terlambat</p>
                    <p className="text-xl font-bold text-rose-700 mt-1">{data.overdue}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Hari Ini</p>
                    <p className="text-xl font-bold text-amber-700 mt-1">{data.dueToday}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">≤7 Hari</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{data.upcoming7}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" /> Renewal Mendesak
                  </h3>
                  <div className="mt-3 space-y-2">
                    {data.list.length === 0 ? (
                      <p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">Tidak ada renewal mendesak 🎉</p>
                    ) : (
                      data.list.map((c) => (
                        <Link key={c.id} href="/dashboard/renewals" onClick={() => setOpen(false)} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition">
                          <span>
                            <span className="block text-sm font-semibold text-slate-900">{c.name}</span>
                            <span className="block text-xs text-slate-500">{c.renewalDate ? new Date(c.renewalDate).toLocaleDateString("id-ID") : "Tanpa tanggal"}</span>
                          </span>
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Renewal</Badge>
                        </Link>
                      ))
                    )}
                  </div>
                  <Link href="/dashboard/renewals" onClick={() => setOpen(false)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-3">
                    Buka Pengingat Renewal <CalendarClock className="w-3 h-3" />
                  </Link>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Tagihan
                  </h3>
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-slate-600">Lihat daftar tagihan belum lunas di halaman Tagihan untuk menindaklanjuti pembayaran.</p>
                    <Link href="/dashboard/invoices" onClick={() => setOpen(false)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2">
                      Buka Tagihan <FileText className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile-friendly exit footer - sticky bottom */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-4 md:p-3">
            <SheetClose
              render={
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 active:bg-slate-950 transition md:py-2.5"
                />
              }
            >
              <X className="w-4 h-4" />
              Tutup
            </SheetClose>
            <p className="mt-2 text-center text-xs text-slate-400 md:hidden">Ketuk di luar panel untuk menutup</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

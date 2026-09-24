"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Trash2, ExternalLink, Loader2, Receipt, Upload, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { deletePayment } from "./actions";

type PaymentRow = {
  id: number;
  invoiceId: number;
  amountPaid: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  note: string | null;
  proofUrl: string | null;
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function InvoicePaymentsSheet({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: { id: number; clientName: string; serviceName: string; totalAmount: number; paidTotal: number; remaining: number; status: string } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !invoice) return;
    setLoading(true);
    fetch(`/api/invoices/${invoice.id}/payments`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPayments(d.payments || []))
      .catch(() => toast.error("Gagal memuat riwayat"))
      .finally(() => setLoading(false));
  }, [open, invoice]);

  async function handleDelete(id: number) {
    if (!confirm("Hapus pembayaran ini? Status tagihan akan diperbarui.")) return;
    setDeleting(id);
    const res = await deletePayment(id);
    setDeleting(null);
    if (res.success) {
      toast.success(res.message);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } else toast.error(res.error);
  }

  if (!invoice) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[520px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Riwayat Pembayaran
          </SheetTitle>
          <SheetDescription>
            {invoice.clientName} • {invoice.serviceName} — Total {formatCurrency(invoice.totalAmount)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(invoice.totalAmount)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Terbayar</p>
              <p className="text-sm font-bold text-emerald-700 mt-1">{formatCurrency(invoice.paidTotal)}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Sisa</p>
              <p className="text-sm font-bold text-rose-700 mt-1">{formatCurrency(invoice.remaining)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Transaksi ({payments.length})
            </h3>
            <Badge variant="outline" className={`text-xs font-semibold ${invoice.status === "PAID" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : invoice.status === "PARTIAL" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>
              {invoice.status}
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-medium text-slate-600">Belum ada pembayaran</p>
              <p className="text-xs text-slate-400 mt-1">Gunakan tombol Bayar/Cicil untuk mencatat transaksi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(p.amountPaid)}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span>{formatDate(p.paymentDate)}</span> {p.paymentMethod && <>• <Badge variant="outline" className="text-xs border-slate-200 bg-slate-50 text-slate-600">{p.paymentMethod}</Badge></>}
                    </p>
                    {p.note && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{p.note}</p>}
                    {p.proofUrl ? (
                      <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
                        <ExternalLink className="w-3 h-3" /> Lihat Bukti
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-2">
                        <Upload className="w-3 h-3" /> Belum ada bukti (kolom proofUrl siap untuk R2)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition disabled:opacity-50"
                    aria-label="Hapus pembayaran"
                  >
                    {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

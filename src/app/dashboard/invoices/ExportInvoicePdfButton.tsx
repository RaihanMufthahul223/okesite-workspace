"use client";

import { useTransition } from "react";
import { Download, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
// jspdf hanya di-load di browser via dynamic import di handleExport — jangan static import agar SSR/Worker tidak ikut bundle 8MB jsPDF

type Props = {
  invoice: {
    id: number;
    totalAmount: number;
    status: string;
    dueDate: string | null;
    createdAt: string | null;
    clientId: number;
    serviceId: number;
    clientName: string;
    serviceName: string;
  };
  variant?: "icon" | "full";
};

export function ExportInvoicePdfButton({ invoice, variant = "icon" }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      try {
        // Try server-enriched fetch first (includes payments, client, service detail)
        const res = await fetch(`/api/invoices/${invoice.id}/pdf-data`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Gagal memuat data invoice: ${res.status}`);
        }
        const data = await res.json();
        // data shape: { invoice, client, service, payments }
        // Dynamic import agar jsPDF tidak ter-bundle di SSR / Cloudflare Worker
        const { downloadInvoicePdf } = await import("@/lib/invoice-pdf");
        await downloadInvoicePdf(data);
        toast.success("PDF berhasil diunduh");
      } catch (err) {
        // Fallback: generate minimal PDF from available data only
        console.error("[ExportPdf] fetch failed, fallback to minimal pdf", err);
        try {
          const { downloadInvoicePdf } = await import("@/lib/invoice-pdf");
          await downloadInvoicePdf({
            invoice: {
              id: invoice.id,
              totalAmount: invoice.totalAmount,
              status: invoice.status,
              dueDate: invoice.dueDate,
              createdAt: invoice.createdAt,
              clientId: invoice.clientId,
              serviceId: invoice.serviceId,
            },
            client: { id: invoice.clientId, name: invoice.clientName, contactInfo: null, websiteUrl: null },
            service: { id: invoice.serviceId, name: invoice.serviceName, basePrice: invoice.totalAmount, description: null },
            payments: [],
          });
          toast.success("PDF (ringkas) berhasil diunduh");
        } catch (fallbackErr) {
          console.error(fallbackErr);
          toast.error("Gagal membuat PDF");
        }
      }
    });
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-slate-500" />}
        {isPending ? "Memproses..." : "Export PDF"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isPending}
      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
      aria-label={`Export PDF tagihan ${invoice.clientName}`}
      title="Export PDF"
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
    </button>
  );
}

"use client";

import jsPDF from "jspdf";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface InvoicePdfData {
  invoice: {
    id: number;
    totalAmount: number;
    status: string;
    dueDate: string | null;
    createdAt: string | null;
    clientId: number;
    serviceId: number;
  };
  client: {
    id: number;
    name: string;
    contactInfo: string | null;
    websiteUrl: string | null;
  } | null;
  service: {
    id: number;
    name: string;
    basePrice: number;
    description: string | null;
  } | null;
  payments: Array<{
    id: number;
    amountPaid: number;
    paymentDate: string | null;
    paymentMethod: string | null;
    note: string | null;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
    month: "long",
    year: "numeric",
  });
}

function statusLabel(status: string): string {
  if (status === "PAID") return "LUNAS";
  if (status === "PARTIAL") return "CICILAN (PARTIAL)";
  return "BELUM BAYAR";
}

function statusColor(status: string): [number, number, number] {
  if (status === "PAID") return [16, 185, 129]; // emerald-500
  if (status === "PARTIAL") return [245, 158, 11]; // amber-500
  return [244, 63, 94]; // rose-500
}

// ─── Main Generator ──────────────────────────────────────────────────────────
export function generateInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  const paidTotal = data.payments.reduce((s, p) => s + (p.amountPaid || 0), 0);
  const remaining = Math.max(0, data.invoice.totalAmount - paidTotal);
  const invoiceNumber = `INV-${String(data.invoice.id).padStart(5, "0")}`;

  // ── Header Bar (blue) ──
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("OkeSite", margin, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Agensi Web & Finansial  •  CRM Internal", margin, 19);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - margin, 14, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceNumber, pageWidth - margin, 19, { align: "right" });

  // Status badge on header
  const [sr, sg, sb] = statusColor(data.invoice.status);
  doc.setFillColor(sr, sg, sb);
  const badgeText = statusLabel(data.invoice.status);
  const badgeW = doc.getTextWidth(badgeText) + 8;
  doc.roundedRect(pageWidth - margin - badgeW, 22, badgeW, 6, 1, 1, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, pageWidth - margin - badgeW / 2, 26, { align: "center" });

  y = 40;
  doc.setTextColor(15, 23, 42); // slate-900

  // ── Meta row (Tanggal & Jatuh Tempo) ──
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("TANGGAL INVOICE", margin, y);
  doc.text("JATUH TEMPO", margin + 55, y);
  doc.text("TOTAL TAGIHAN", margin + 110, y);
  y += 4;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(data.invoice.createdAt), margin, y);
  doc.text(formatDate(data.invoice.dueDate), margin + 55, y);
  doc.text(formatCurrency(data.invoice.totalAmount), margin + 110, y);
  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ── Bill To & Service ──
  const colW = (pageWidth - margin * 2 - 10) / 2;
  const leftX = margin;
  const rightX = margin + colW + 10;

  // Bill To
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TAGIHAN KEPADA", leftX, y);
  doc.setFont("helvetica", "normal");
  y += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const clientName = data.client?.name ?? `Klien #${data.invoice.clientId}`;
  doc.text(clientName, leftX, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  if (data.client?.contactInfo) {
    doc.text(`Kontak: ${data.client.contactInfo}`, leftX, y);
    y += 4;
  }
  if (data.client?.websiteUrl) {
    doc.text(`Website: ${data.client.websiteUrl}`, leftX, y);
    y += 4;
  }
  if (!data.client?.contactInfo && !data.client?.websiteUrl) {
    doc.text("—", leftX, y);
    y += 4;
  }

  // Service (right column) — reset y to same top
  let ry = 47;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("LAYANAN / PAKET", rightX, ry);
  ry += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const serviceName = data.service?.name ?? `Layanan #${data.invoice.serviceId}`;
  // wrap service name if long
  const serviceLines = doc.splitTextToSize(serviceName, colW);
  doc.text(serviceLines, rightX, ry);
  ry += serviceLines.length * 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  if (data.service?.description) {
    const descLines = doc.splitTextToSize(data.service.description, colW);
    doc.text(descLines.slice(0, 3), rightX, ry);
    ry += Math.min(descLines.length, 3) * 4;
  }
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text(`Harga paket: ${formatCurrency(data.service?.basePrice ?? data.invoice.totalAmount)}`, rightX, ry);
  ry += 4;

  y = Math.max(y, ry) + 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ── Ringkasan Pembayaran (3 boxes) ──
  const boxW = (pageWidth - margin * 2 - 8) / 3;
  const boxH = 18;
  const boxes: Array<{ label: string; value: string; color: [number, number, number] }> = [
    { label: "TOTAL TAGIHAN", value: formatCurrency(data.invoice.totalAmount), color: [15, 23, 42] },
    { label: "SUDAH DIBAYAR", value: formatCurrency(paidTotal), color: [16, 185, 129] },
    { label: "SISA TAGIHAN", value: formatCurrency(remaining), color: remaining > 0 ? [244, 63, 94] : [16, 185, 129] },
  ];
  // Background boxes
  boxes.forEach((b, i) => {
    const bx = margin + i * (boxW + 4);
    const isLast = i === 2;
    if (isLast && remaining === 0) {
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(167, 243, 208);
    } else if (isLast && remaining > 0) {
      doc.setFillColor(255, 241, 242); // rose-50
      doc.setDrawColor(254, 205, 211);
    } else if (i === 1) {
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
    } else {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);
    }
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, "FD");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(b.label, bx + boxW / 2, y + 5, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(b.color[0], b.color[1], b.color[2]);
    doc.text(b.value, bx + boxW / 2, y + 11, { align: "center" });
  });
  y += boxH + 8;

  // ── Progress bar ──
  const progress = data.invoice.totalAmount > 0 ? Math.round((paidTotal / data.invoice.totalAmount) * 100) : 0;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Progress pembayaran: ${progress}%`, margin, y);
  y += 2;
  const barW = pageWidth - margin * 2;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(margin, y, barW, 3, 1.5, 1.5, "F");
  if (progress > 0) {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(margin, y, (barW * progress) / 100, 3, 1.5, 1.5, "F");
  }
  y += 8;

  // ── Tabel Pembayaran ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Riwayat Pembayaran", margin, y);
  y += 3;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`${data.payments.length} transaksi`, margin, y);
  y += 5;

  if (data.payments.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, "D");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Belum ada pembayaran tercatat untuk tagihan ini.", pageWidth / 2, y + 8, { align: "center" });
    y += 20;
  } else {
    // Table header
    const colX = [margin, margin + 28, margin + 62, margin + 98, pageWidth - margin - 34];
    const colWidths = [28, 34, 36, 34, 34];
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageWidth - margin * 2, 7, "D");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    const headers = ["TANGGAL", "METODE", "JUMLAH", "CATATAN", "NO"];
    headers.forEach((h, i) => {
      const align = i === 2 ? "right" : "left";
      const x = i === 2 ? colX[i] + colWidths[i] - 2 : colX[i] + 2;
      doc.text(h, x, y + 4.5, { align: align as "left" | "right" });
    });
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    data.payments.forEach((p, idx) => {
      // Check page overflow
      if (y > pageHeight - 22) {
        doc.addPage();
        y = 14;
      }
      const rowH = 7;
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y, pageWidth - margin * 2, rowH, "F");
      }
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, rowH, "D");
      doc.setTextColor(15, 23, 42);
      // tanggal
      doc.text(formatDate(p.paymentDate), colX[0] + 2, y + 4.5);
      doc.text(p.paymentMethod || "—", colX[1] + 2, y + 4.5);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(p.amountPaid), colX[2] + colWidths[2] - 2, y + 4.5, { align: "right" });
      doc.setFont("helvetica", "normal");
      const note = p.note ? (p.note.length > 22 ? p.note.slice(0, 22) + "…" : p.note) : "—";
      doc.text(note, colX[3] + 2, y + 4.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`#${p.id}`, colX[4] + 2, y + 4.5);
      doc.setTextColor(15, 23, 42);
      y += rowH;
    });
    y += 4;
  }

  // ── Footer ──
  const footerY = pageHeight - 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen dibuat otomatis oleh OkeSite CRM  •  ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}  •  ${invoiceNumber}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );
  doc.setFontSize(6);
  doc.text("Terima kasih atas kepercayaan Anda menggunakan layanan OkeSite.", pageWidth / 2, footerY + 4, { align: "center" });

  return doc;
}

export function downloadInvoicePdf(data: InvoicePdfData, filename?: string) {
  const doc = generateInvoicePdf(data);
  const invoiceNumber = `INV-${String(data.invoice.id).padStart(5, "0")}`;
  const clientSlug = (data.client?.name || "klien").replace(/\s+/g, "-").toLowerCase().slice(0, 20);
  const defaultName = `${invoiceNumber}-${clientSlug}.pdf`;
  doc.save(filename || defaultName);
}

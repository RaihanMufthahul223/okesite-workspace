
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { db, safeSelectPayments } from "@/db";
import { clients, invoices } from "@/db/schema";
import { Users, TrendingUp, AlertCircle, Calendar, ArrowRight, FileText, CheckCircle2, Clock, CalendarClock, AlertTriangle, History } from "lucide-react";
import type { Metadata } from "next";
import { RevenueChart, InvoiceStatusChart, ClientStatusChart } from "./DashboardCharts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — OkeSite CRM",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [allClients, allInvoices, allPayments] = await Promise.all([
    db.select().from(clients),
    db.select().from(invoices),
    safeSelectPayments(),
  ]);

  // 1. Total Active Clients (Status DEAL)
  const totalActive = allClients.filter((c) => c.status === "DEAL").length;

  // 2. Revenue This Month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthPayments = allPayments.filter((p) => {
    if (!p.paymentDate) return false;
    const d = new Date(p.paymentDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const revenueThisMonth = thisMonthPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  // 3. Unpaid / Partial Invoices
  const unpaidInvoices = allInvoices.filter((i) => i.status !== "PAID");
  const unpaidCount = unpaidInvoices.length;
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  // 4. Monthly Revenue (last 6 months)
  const now = new Date();
  const monthLabels: { key: string; label: string; month: number; year: number }[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      month: d.getMonth(),
      year: d.getFullYear(),
    };
  });

  const monthlyRevenue = monthLabels.map((m) => {
    const filtered = allPayments.filter((p) => {
      if (!p.paymentDate) return false;
      const d = new Date(p.paymentDate);
      return d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    return {
      month: m.label.charAt(0).toUpperCase() + m.label.slice(1),
      revenue: filtered.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
      count: filtered.length,
    };
  });

  // 5. Invoice status distribution
  const invoiceStatusData = [
    { name: "Lunas", value: allInvoices.filter((i) => i.status === "PAID").length, color: "#10b981" },
    { name: "Cicil", value: allInvoices.filter((i) => i.status === "PARTIAL").length, color: "#f59e0b" },
    { name: "Belum Bayar", value: allInvoices.filter((i) => i.status === "UNPAID").length, color: "#f43f5e" },
  ].filter((d) => d.value > 0);

  // 6. Client status distribution
  const clientStatusData = [
    { name: "DEAL", value: allClients.filter((c) => c.status === "DEAL").length, color: "#10b981" },
    { name: "Follow Up", value: allClients.filter((c) => c.status === "FOLLOW_UP").length, color: "#f59e0b" },
    { name: "REJECT", value: allClients.filter((c) => c.status === "REJECT").length, color: "#f43f5e" },
  ].filter((d) => d.value > 0);

  // 7. Action items (Follow Ups or Renewal < 14 days)
  const todayActions = allClients.filter((c) => {
    if (c.status === "FOLLOW_UP") return true;
    const days = daysUntil(c.renewalDate);
    return days !== null && days >= 0 && days <= 14;
  });

  // 8. Renewal reminder summary (for dedicated widget)
  const renewalGroups = {
    overdue: allClients.filter((c) => {
      const d = daysUntil(c.renewalDate);
      return d !== null && d < 0;
    }),
    today: allClients.filter((c) => daysUntil(c.renewalDate) === 0),
    upcoming7: allClients.filter((c) => {
      const d = daysUntil(c.renewalDate);
      return d !== null && d > 0 && d <= 7;
    }),
    upcoming14: allClients.filter((c) => {
      const d = daysUntil(c.renewalDate);
      return d !== null && d > 7 && d <= 14;
    }),
    upcoming30: allClients.filter((c) => {
      const d = daysUntil(c.renewalDate);
      return d !== null && d > 14 && d <= 30;
    }),
  };
  const renewalUrgentCount = renewalGroups.overdue.length + renewalGroups.today.length + renewalGroups.upcoming7.length;
  const renewalSoonList = [...renewalGroups.overdue, ...renewalGroups.today, ...renewalGroups.upcoming7, ...renewalGroups.upcoming14].slice(0, 5);

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Ringkasan Agensi
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Pantau kesehatan bisnis, prospek klien, dan status tagihan keuangan Anda.
        </p>
      </div>

      {/* ── 3 Metric Cards (Mobile: Column, Desktop: Grid 3) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Klien Aktif */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Klien Aktif
            </p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalActive}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              Status: Deal
            </span>
            <span className="text-xs text-slate-400">dari {allClients.length} prospek</span>
          </div>
        </div>

        {/* Card 2: Pendapatan Bulan Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pendapatan Bulan Ini
            </p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
            {formatCurrency(revenueThisMonth)}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {thisMonthPayments.length} transaksi pembayaran masuk
          </p>
        </div>

        {/* Card 3: Tagihan Belum Dibayar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tagihan Belum Dibayar
            </p>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
            {unpaidCount > 0 ? formatCurrency(totalUnpaidAmount) : "Rp 0"}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${unpaidCount > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
              {unpaidCount} Tagihan Pending
            </span>
          </div>
        </div>
      </div>

      {/* ── Section: Charts (Pendapatan + Status) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={monthlyRevenue} />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <InvoiceStatusChart data={invoiceStatusData} />
          <ClientStatusChart data={clientStatusData} />
        </div>
      </div>

      {/* ── Section: Pengingat Renewal ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-600" />
              Pengingat Renewal
            </h2>
            <p className="text-xs text-slate-500">Domain & hosting yang butuh perpanjangan — jangan sampai terlewat</p>
          </div>
          <Link
            href="/dashboard/renewals"
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold transition-colors"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Renewal summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`rounded-2xl border p-4 shadow-xs ${renewalGroups.overdue.length > 0 ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Terlambat</p>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-700 mt-1">{renewalGroups.overdue.length}</p>
            <p className="text-xs text-rose-600/70 mt-1">Lewat jatuh tempo</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Hari Ini</p>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{renewalGroups.today.length}</p>
            <p className="text-xs text-slate-400 mt-1">Jatuh tempo hari ini</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">≤ 7 Hari</p>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{renewalGroups.upcoming7.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">≤ 30 Hari</p>
              <History className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-1">{renewalGroups.upcoming30.length + renewalGroups.upcoming14.length}</p>
            <p className="text-xs text-slate-400 mt-1">14–30 hari ke depan</p>
          </div>
        </div>

        {/* Renewal urgent list */}
        {renewalUrgentCount === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Tidak ada perpanjangan mendesak</p>
            <p className="text-xs text-slate-500 mt-1">Semua domain & hosting masih aman dalam 7 hari ke depan.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {renewalSoonList.map((client) => {
              const days = daysUntil(client.renewalDate);
              const isOverdue = days !== null && days < 0;
              const isToday = days === 0;
              return (
                <div key={client.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">{client.name}</p>
                    <p className="text-xs text-slate-500 truncate">{client.websiteUrl || "Tanpa domain"} • {client.contactInfo || "Tanpa kontak"}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${isOverdue ? "bg-rose-100 text-rose-700" : isToday ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                    <CalendarClock className="w-3 h-3" />
                    {isOverdue ? `Terlambat ${Math.abs(days!)} hari` : isToday ? "Hari ini" : `${days} hari lagi`}
                  </span>
                </div>
              );
            })}
            {renewalUrgentCount > 5 && (
              <Link href="/dashboard/renewals" className="flex items-center justify-center gap-1 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition">
                Lihat {renewalUrgentCount - 5} lainnya <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Section: Aksi Hari Ini ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Aksi Hari Ini</h2>
            <p className="text-xs text-slate-500">Prospek &amp; domain yang memerlukan perhatian segera</p>
          </div>
          <Link
            href="/dashboard/clients"
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold transition-colors"
          >
            Daftar Klien <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayActions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-900 font-semibold text-sm">Semua Tugas Selesai!</p>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              Tidak ada prospek yang memerlukan follow-up atau perpanjangan domain dalam 14 hari ke depan.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {todayActions.slice(0, 8).map((client) => {
              const days = daysUntil(client.renewalDate);
              const isRenewalSoon = days !== null && days >= 0 && days <= 14;
              const isFollowUp = client.status === "FOLLOW_UP";

              return (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {client.contactInfo || "Tanpa kontak"} • {client.websiteUrl || "Tanpa domain"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isFollowUp && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
                        <Clock className="w-3 h-3" />
                        Follow Up
                      </span>
                    )}
                    {isRenewalSoon && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold">
                        <Calendar className="w-3 h-3" />
                        Renewal: {days === 0 ? "Hari ini" : `${days} hari lagi`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


export const runtime = "edge";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { db } from "@/db";
import { clients, invoices, payments } from "@/db/schema";
import { Users, TrendingUp, AlertCircle, Calendar, ArrowRight, FileText, CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";

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
    db.select().from(payments),
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

  // 4. Action items (Follow Ups or Renewal < 14 days)
  const todayActions = allClients.filter((c) => {
    if (c.status === "FOLLOW_UP") return true;
    const days = daysUntil(c.renewalDate);
    return days !== null && days >= 0 && days <= 14;
  });

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


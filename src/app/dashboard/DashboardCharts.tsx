"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Types ─────────────────────────────────────────────────────────────────
export type MonthlyRevenue = {
  month: string;
  revenue: number;
  count: number;
};

export type StatusDatum = {
  name: string;
  value: number;
  color: string;
};

// ─── Revenue Chart (Bar) ────────────────────────────────────────────────────
export function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Pendapatan 6 Bulan Terakhir</h3>
          <p className="text-xs text-slate-500 mt-0.5">Akumulasi pembayaran per bulan (berdasarkan tanggal bayar)</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-600" /> IDR
        </span>
      </div>

      {!hasData ? (
        <div className="h-[220px] md:h-[260px] flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-sm font-medium text-slate-600">Belum ada pendapatan tercatat</p>
          <p className="text-xs text-slate-400 mt-1">Pembayaran akan muncul di grafik setelah tagihan dibayar</p>
        </div>
      ) : (
        <div className="h-[220px] md:h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={formatCurrencyShort}
                width={56}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, _name: any, props: any) => [
                  formatCurrencyFull(value as number),
                  `Pendapatan (${props.payload.count} trx)`,
                ]}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#2563eb" barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Donut Chart Generic ───────────────────────────────────────────────────
function DonutChart({
  title,
  subtitle,
  data,
  emptyText,
}: {
  title: string;
  subtitle: string;
  data: StatusDatum[];
  emptyText: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const hasData = total > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {!hasData ? (
        <div className="h-[220px] flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 px-4">
          <p className="text-sm font-medium text-slate-600">{emptyText}</p>
          <p className="text-xs text-slate-400 mt-1">Data akan tampil setelah ada transaksi</p>
        </div>
      ) : (
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [`${value} tagihan`, name as string]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: "#334155", fontSize: "12px", fontWeight: 500 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-slate-400 -mt-2">Total {total} item</p>
        </div>
      )}
    </div>
  );
}

// ─── Invoice Status Donut ──────────────────────────────────────────────────
export function InvoiceStatusChart({ data }: { data: StatusDatum[] }) {
  return (
    <DonutChart
      title="Status Tagihan"
      subtitle="Distribusi Lunas / Cicil / Belum Bayar"
      data={data}
      emptyText="Belum ada tagihan"
    />
  );
}

// ─── Client Status Donut ───────────────────────────────────────────────────
export function ClientStatusChart({ data }: { data: StatusDatum[] }) {
  return (
    <DonutChart
      title="Status Klien"
      subtitle="DEAL / Follow Up / REJECT"
      data={data}
      emptyText="Belum ada klien"
    />
  );
}

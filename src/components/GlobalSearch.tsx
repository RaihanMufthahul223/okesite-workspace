"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Package, FileText, LayoutDashboard, X, Loader2, ArrowRight } from "lucide-react";

type SearchResults = {
  clients: Array<{ id: number; name: string; status: string; contactInfo: string | null; websiteUrl: string | null }>;
  services: Array<{ id: number; name: string; basePrice: number; description: string | null }>;
  invoices: Array<{ id: number; clientName: string; serviceName: string; totalAmount: number; status: string }>;
  navigation: Array<{ label: string; href: string; desc: string }>;
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function Badge({ status, label }: { status: string; label?: string }) {
  const map: Record<string, string> = {
    DEAL: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    FOLLOW_UP: "bg-amber-100 text-amber-700 border-amber-200",
    PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
    REJECT: "bg-rose-100 text-rose-700 border-rose-200",
    UNPAID: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const cls = map[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{label || status}</span>;
}

export function GlobalSearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(null);
    setSelected(0);
  }, []);

  const openPalette = useCallback(() => setOpen(true), []);

  // Listen to Cmd+K / Ctrl+K and custom event
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) close();
    };
    const onCustom = () => openPalette();
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette" as unknown as string, onCustom as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette" as unknown as string, onCustom as EventListener);
    };
  }, [open, close, openPalette]);

  // Focus input when open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    // allow empty to show navigation
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as SearchResults;
        setResults(data);
        setSelected(0);
      } catch {
        // ignore abort
      } finally {
        setLoading(false);
      }
    }, q.length === 0 ? 0 : 220);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, open]);

  // Build flat list for keyboard nav
  const flat: Array<{ href: string; label: string }> = [];
  if (results) {
    results.navigation.forEach((n) => flat.push({ href: n.href, label: n.label }));
    results.clients.forEach((c) => flat.push({ href: `/dashboard/clients`, label: c.name }));
    results.services.forEach((s) => flat.push({ href: `/dashboard/services`, label: s.name }));
    results.invoices.forEach((inv) => flat.push({ href: `/dashboard/invoices`, label: `${inv.clientName}` }));
  }

  function handleSelectHref(href: string) {
    close();
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, Math.max(0, flat.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[selected];
      if (item) handleSelectHref(item.href);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={close} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Cari klien, layanan, tagihan, atau halaman..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <button
              onClick={close}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-2 space-y-4">
          {!results ? (
            <div className="p-8 text-center text-sm text-slate-500">Memuat...</div>
          ) : (
            <>
              {/* Quick hint when empty query */}
              {query.trim().length === 0 && (
                <p className="px-3 py-1 text-xs text-slate-400">
                  Ketik untuk mencari • <span className="font-medium">⌘K</span> untuk buka/tutup • <span className="font-medium">↑↓</span> navigasi • <span className="font-medium">Enter</span> buka
                </p>
              )}

              {/* Navigation */}
              {results.navigation.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-semibold tracking-wider uppercase text-slate-400">Navigasi</p>
                  <div className="space-y-1">
                    {results.navigation.map((nav, idx) => {
                      const isSelected = flat.findIndex((f) => f.href === nav.href && f.label === nav.label) === selected;
                      return (
                        <button
                          key={nav.href}
                          onClick={() => handleSelectHref(nav.href)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200 hover:bg-slate-50"}`}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                              <LayoutDashboard className="w-4 h-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-900 truncate">{nav.label}</span>
                              <span className="block text-xs text-slate-500 truncate">{nav.desc}</span>
                            </span>
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clients */}
              {results.clients.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Klien
                  </p>
                  <div className="space-y-1">
                    {results.clients.map((c) => {
                      const href = `/dashboard/clients`;
                      const isSelected = flat.findIndex((f) => f.href === href && f.label === c.name) === selected;
                      return (
                        <button
                          key={`c-${c.id}`}
                          onClick={() => handleSelectHref(href)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200 hover:bg-slate-50"}`}
                        >
                          <span className="min-w-0 flex-1 pr-3">
                            <span className="block text-sm font-semibold text-slate-900 truncate">{c.name}</span>
                            <span className="block text-xs text-slate-500 truncate">{c.contactInfo || "Tanpa kontak"} {c.websiteUrl ? `• ${c.websiteUrl}` : ""}</span>
                          </span>
                          <Badge status={c.status} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Services */}
              {results.services.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Layanan
                  </p>
                  <div className="space-y-1">
                    {results.services.map((s) => {
                      const href = `/dashboard/services`;
                      const isSelected = flat.findIndex((f) => f.href === href && f.label === s.name) === selected;
                      return (
                        <button
                          key={`s-${s.id}`}
                          onClick={() => handleSelectHref(href)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200 hover:bg-slate-50"}`}
                        >
                          <span className="min-w-0 flex-1 pr-3">
                            <span className="block text-sm font-semibold text-slate-900 truncate">{s.name}</span>
                            <span className="block text-xs text-slate-500 truncate">{s.description || "Tanpa deskripsi"}</span>
                          </span>
                          <span className="text-xs font-bold text-blue-600 flex-shrink-0">{formatCurrency(s.basePrice)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {results.invoices.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Tagihan
                  </p>
                  <div className="space-y-1">
                    {results.invoices.map((inv) => {
                      const href = `/dashboard/invoices`;
                      const isSelected = flat.findIndex((f) => f.href === href && f.label === inv.clientName) === selected;
                      return (
                        <button
                          key={`inv-${inv.id}`}
                          onClick={() => handleSelectHref(href)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "bg-white border border-slate-200 hover:bg-slate-50"}`}
                        >
                          <span className="min-w-0 flex-1 pr-3">
                            <span className="block text-sm font-semibold text-slate-900 truncate">
                              {inv.clientName} <span className="text-slate-400 font-normal">•</span> {inv.serviceName}
                            </span>
                            <span className="block text-xs text-slate-500">{formatCurrency(inv.totalAmount)} • #{inv.id}</span>
                          </span>
                          <Badge status={inv.status} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.clients.length === 0 && results.services.length === 0 && results.invoices.length === 0 && results.navigation.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-slate-600">Tidak ada hasil untuk &quot;{query}&quot;</p>
                  <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau cek ejaan</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
          <span className="hidden sm:inline">Navigasi cepat lintas klien, layanan, tagihan</span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">ESC</span> tutup
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper to dispatch open event – used by header buttons
export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }
}

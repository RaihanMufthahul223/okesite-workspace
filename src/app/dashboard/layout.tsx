"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Menu,
  ChevronRight,
  Search,
} from "lucide-react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";
import { GlobalSearchPalette, openCommandPalette } from "@/components/GlobalSearch";

const navItems: Array<{ href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  {
    href: "/dashboard",
    label: "Ringkasan",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/clients",
    label: "Klien & Prospek",
    icon: Users,
  },
  {
    href: "/dashboard/services",
    label: "Layanan Agensi",
    icon: CreditCard,
  },
  {
    href: "/dashboard/invoices",
    label: "Tagihan",
    icon: FileText,
  },
];

function getBreadcrumb(pathname: string): { parent: string; title: string } {
  if (pathname === "/dashboard") return { parent: "Ruang Kerja", title: "Dashboard / Ringkasan" };
  if (pathname.startsWith("/dashboard/clients")) return { parent: "CRM", title: "Daftar Klien & Prospek" };
  if (pathname.startsWith("/dashboard/services")) return { parent: "Katalog", title: "Layanan Agensi" };
  if (pathname.startsWith("/dashboard/invoices")) return { parent: "Keuangan", title: "Daftar Tagihan" };
  return { parent: "Dashboard", title: "Ringkasan" };
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }
            `}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/80">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-0.5 shadow-xs flex-shrink-0">
        <Image
          src="/logo.png"
          alt="OkeSite Logo"
          width={36}
          height={36}
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
      <div className="min-w-0">
        <p className="font-bold text-slate-900 text-sm leading-tight">OkeSite CRM</p>
        <p className="text-slate-500 text-xs truncate">Agensi Web &amp; Finansial</p>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="px-4 py-4 border-t border-slate-200/80 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <UserButton />
        <div className="min-w-0">
          <p className="text-xs text-slate-900 leading-none font-semibold">Akun Saya</p>
          <p className="text-xs text-slate-500 mt-1 truncate">Kelola Profil &amp; Akses</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <GlobalSearchPalette />

      {/* ── Desktop Sidebar (Fixed left, hidden on mobile) ── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        <SidebarLogo />
        <NavLinks pathname={pathname} />
        <SidebarFooter />
      </aside>

      {/* ── Right Column: Top Bar + Scrollable Content Area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Desktop Top Header Bar (Breadcrumb + User Profile) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">{breadcrumb.parent}</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-slate-900 font-semibold">{breadcrumb.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCommandPalette}
              className="hidden lg:flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-white hover:border-slate-300 hover:text-slate-700 transition min-w-[240px] justify-between"
              aria-label="Buka pencarian (⌘K)"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                Cari klien, tagihan...
              </span>
              <span className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium text-slate-500">⌘K</span>
            </button>
            <button
              onClick={openCommandPalette}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent hover:border-slate-200 transition"
              aria-label="Cari"
            >
              <Search className="w-5 h-5" />
            </button>
            <UserButton />
          </div>
        </header>

        {/* Mobile Sticky Header (<768px) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    aria-label="Buka navigasi"
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  />
                }
              >
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col h-full">
                  <SidebarLogo />
                  <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                  <SidebarFooter />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-200 p-0.5 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="OkeSite Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
              <span className="font-bold text-slate-900 text-sm">OkeSite CRM</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCommandPalette}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Cari (⌘K)"
            >
              <Search className="w-5 h-5" />
            </button>
            <UserButton />
          </div>
        </header>

        {/* Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import type { Client } from "@/db/schema";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, PhoneCall, Globe, Trash2, X, Clock } from "lucide-react";
import { updateClientStatus, deleteClient } from "./actions";

const statusConfig = {
  FOLLOW_UP: {
    label: "Follow Up",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  DEAL: {
    label: "Deal",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  REJECT: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 border-rose-200",
  },
} as const;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Belum diatur";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

interface ClientDetailSheetProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailSheet({ client, open, onOpenChange }: ClientDetailSheetProps) {
  const [loading, setLoading] = useState(false);

  if (!client) return null;

  const currentStatus = statusConfig[client.status];
  const renewalDays = daysUntil(client.renewalDate);

  async function handleStatusChange(newStatus: "FOLLOW_UP" | "DEAL" | "REJECT") {
    if (!client) return;
    setLoading(true);
    try {
      await updateClientStatus(client.id, newStatus);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!client || !confirm(`Apakah Anda yakin ingin menghapus klien ${client.name}?`)) return;
    setLoading(true);
    try {
      await deleteClient(client.id);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between">
          <div>
            <SheetTitle>{client.name}</SheetTitle>
            <SheetDescription>Detail Lengkap &amp; Catatan Klien</SheetDescription>
          </div>
          <SheetClose
            render={
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Tutup detail"
              />
            }
          >
            <X className="w-5 h-5" />
          </SheetClose>
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Quick Status Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status Saat Ini
              </p>
              <Badge variant="outline" className={`mt-1 font-semibold ${currentStatus.className}`}>
                {currentStatus.label}
              </Badge>
            </div>
            {/* Quick Status Buttons */}
            <div className="flex items-center gap-1.5">
              {(["FOLLOW_UP", "DEAL", "REJECT"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  disabled={loading || client.status === st}
                  onClick={() => handleStatusChange(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    client.status === st
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {st === "FOLLOW_UP" ? "Follow Up" : st === "DEAL" ? "Deal" : "Reject"}
                </button>
              ))}
            </div>
          </div>

          {/* Contact & Website Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Informasi Kontak &amp; Website
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <PhoneCall className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Kontak Person / Telepon</p>
                  <p className="font-medium text-slate-900">{client.contactInfo || "—"}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-start gap-3 text-sm">
                <Globe className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Website URL</p>
                  {client.websiteUrl ? (
                    <a
                      href={client.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {client.websiteUrl} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <p className="font-medium text-slate-400">—</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-start gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Tanggal Perpanjangan Domain/Hosting</p>
                  <p className="font-semibold text-slate-900">{formatDate(client.renewalDate)}</p>
                  {renewalDays !== null && (
                    <p className={`text-xs mt-0.5 ${renewalDays <= 14 ? "text-rose-600 font-bold" : "text-slate-500"}`}>
                      {renewalDays < 0
                        ? "Sudah Lewat Tanggal Perpanjangan!"
                        : renewalDays === 0
                        ? "Hari Ini Jatuh Tempo!"
                        : `${renewalDays} hari lagi sampai perpanjangan`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Catatan Terakhir
            </h3>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {client.lastNote || "Belum ada catatan untuk klien ini."}
              </p>
            </div>
          </div>
        </div>

        {/* Sheet Footer */}
        <div className="p-6 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
          <Button
            variant="destructive"
            size="sm"
            disabled={loading}
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Klien
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold rounded-xl"
          >
            Tutup
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

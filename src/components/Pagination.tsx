"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-xs">
      <p className="text-xs text-slate-500">
        Menampilkan <span className="font-semibold text-slate-900">{start}–{end}</span> dari {totalItems}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 px-2.5 rounded-xl border-slate-200"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </Button>
        <span className="text-xs font-semibold text-slate-700 px-2">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 px-2.5 rounded-xl border-slate-200"
        >
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function SortButton({
  active,
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 hover:text-slate-900 transition ${active ? "text-blue-600" : "text-slate-500"}`}
    >
      {children}
      <span className={`text-xs ${active ? "opacity-100" : "opacity-40"}`}>{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
    </button>
  );
}

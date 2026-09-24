/**
 * Renewal helper utilities — pure functions safe for both client & edge runtime.
 * Follows architecture.md: database uses text ISO date for renewal_date.
 */

export type RenewalCategory =
  | "OVERDUE"
  | "TODAY"
  | "UPCOMING_7"
  | "UPCOMING_14"
  | "UPCOMING_30"
  | "UPCOMING_60"
  | "LATER"
  | "NO_DATE";

export interface RenewalInfo {
  daysUntil: number | null;
  category: RenewalCategory;
  label: string;
  badgeClass: string;
  urgency: number; // lower = more urgent, for sorting
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  // Normalize to midnight to avoid timezone jitter
  const target = new Date(dateStr);
  const now = new Date();
  // Reset hours for fair day diff
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.ceil((t - n) / (1000 * 60 * 60 * 24));
}

export function getRenewalInfo(dateStr: string | null): RenewalInfo {
  const d = daysUntil(dateStr);
  if (d === null) {
    return {
      daysUntil: null,
      category: "NO_DATE",
      label: "Tanpa tanggal",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      urgency: 999,
    };
  }
  if (d < 0) {
    return {
      daysUntil: d,
      category: "OVERDUE",
      label: `Terlambat ${Math.abs(d)} hari`,
      badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
      urgency: 0,
    };
  }
  if (d === 0) {
    return {
      daysUntil: d,
      category: "TODAY",
      label: "Hari ini",
      badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
      urgency: 1,
    };
  }
  if (d <= 7) {
    return {
      daysUntil: d,
      category: "UPCOMING_7",
      label: `${d} hari lagi`,
      badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
      urgency: 2,
    };
  }
  if (d <= 14) {
    return {
      daysUntil: d,
      category: "UPCOMING_14",
      label: `${d} hari lagi`,
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      urgency: 3,
    };
  }
  if (d <= 30) {
    return {
      daysUntil: d,
      category: "UPCOMING_30",
      label: `${d} hari lagi`,
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
      urgency: 4,
    };
  }
  if (d <= 60) {
    return {
      daysUntil: d,
      category: "UPCOMING_60",
      label: `${d} hari lagi`,
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
      urgency: 5,
    };
  }
  return {
    daysUntil: d,
    category: "LATER",
    label: `${d} hari lagi`,
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    urgency: 6,
  };
}

export function formatRenewalDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildWhatsAppLink(
  clientName: string,
  websiteUrl: string | null,
  renewalDate: string | null,
  contactInfo: string | null
): string | null {
  if (!contactInfo) return null;
  // Extract digits for wa.me
  const digits = contactInfo.replace(/\D/g, "");
  if (digits.length < 9) return null;
  // Normalize Indonesian numbers: 0 -> 62
  let phone = digits;
  if (phone.startsWith("0")) phone = "62" + phone.slice(1);
  const dateLabel = renewalDate ? formatRenewalDate(renewalDate) : "segera";
  const siteLabel = websiteUrl || "website Anda";
  const text = `Halo ${clientName}, pengingat perpanjangan untuk ${siteLabel} jatuh tempo pada ${dateLabel}. Apakah ingin kami bantu perpanjang? — OkeSite`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export const CATEGORY_LABEL: Record<RenewalCategory, string> = {
  OVERDUE: "Terlambat",
  TODAY: "Hari ini",
  UPCOMING_7: "≤ 7 hari",
  UPCOMING_14: "≤ 14 hari",
  UPCOMING_30: "≤ 30 hari",
  UPCOMING_60: "≤ 60 hari",
  LATER: "> 60 hari",
  NO_DATE: "Tanpa tanggal",
};

export const CATEGORY_ORDER: RenewalCategory[] = [
  "OVERDUE",
  "TODAY",
  "UPCOMING_7",
  "UPCOMING_14",
  "UPCOMING_30",
  "UPCOMING_60",
  "LATER",
  "NO_DATE",
];

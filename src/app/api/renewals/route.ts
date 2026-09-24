
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getRenewalInfo } from "@/lib/renewal";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "ALL"; // ALL | OVERDUE | UPCOMING_7 | TODAY etc or days param
  const daysParam = url.searchParams.get("days"); // e.g. 14 -> <=14 days

  const allClients = await db.select().from(clients).orderBy(desc(clients.createdAt));

  const enriched = allClients.map((c) => {
    const info = getRenewalInfo(c.renewalDate);
    return { ...c, renewalInfo: info };
  });

  // Sort by urgency then renewalDate
  enriched.sort((a, b) => {
    if (a.renewalInfo.urgency !== b.renewalInfo.urgency) return a.renewalInfo.urgency - b.renewalInfo.urgency;
    if (!a.renewalDate && !b.renewalDate) return 0;
    if (!a.renewalDate) return 1;
    if (!b.renewalDate) return -1;
    return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
  });

  let filtered = enriched;
  if (daysParam) {
    const maxDays = Number(daysParam);
    if (Number.isFinite(maxDays)) {
      filtered = enriched.filter((c) => {
        if (c.renewalInfo.daysUntil === null) return false;
        return c.renewalInfo.daysUntil >= 0 && c.renewalInfo.daysUntil <= maxDays;
      });
    }
  } else if (filter !== "ALL") {
    if (filter === "OVERDUE") filtered = enriched.filter((c) => c.renewalInfo.category === "OVERDUE");
    else if (filter === "TODAY") filtered = enriched.filter((c) => c.renewalInfo.category === "TODAY");
    else if (filter === "UPCOMING_7") filtered = enriched.filter((c) => c.renewalInfo.category === "UPCOMING_7" || c.renewalInfo.category === "TODAY" || c.renewalInfo.category === "OVERDUE");
    else if (filter === "UPCOMING_14") filtered = enriched.filter((c) => c.renewalInfo.daysUntil !== null && c.renewalInfo.daysUntil >= 0 && c.renewalInfo.daysUntil <= 14);
    else if (filter === "UPCOMING_30") filtered = enriched.filter((c) => c.renewalInfo.daysUntil !== null && c.renewalInfo.daysUntil >= 0 && c.renewalInfo.daysUntil <= 30);
    else if (filter === "NO_DATE") filtered = enriched.filter((c) => c.renewalInfo.category === "NO_DATE");
    else filtered = enriched.filter((c) => c.renewalInfo.category === filter);
  }

  const summary = {
    totalTracked: enriched.filter((c) => c.renewalDate !== null).length,
    overdue: enriched.filter((c) => c.renewalInfo.category === "OVERDUE").length,
    today: enriched.filter((c) => c.renewalInfo.category === "TODAY").length,
    upcoming7: enriched.filter((c) => c.renewalInfo.daysUntil !== null && c.renewalInfo.daysUntil >= 0 && c.renewalInfo.daysUntil <= 7).length,
    upcoming14: enriched.filter((c) => c.renewalInfo.daysUntil !== null && c.renewalInfo.daysUntil >= 0 && c.renewalInfo.daysUntil <= 14).length,
    upcoming30: enriched.filter((c) => c.renewalInfo.daysUntil !== null && c.renewalInfo.daysUntil >= 0 && c.renewalInfo.daysUntil <= 30).length,
  };

  return Response.json(
    { clients: filtered, summary, total: enriched.length },
    { headers: { "Cache-Control": "no-store" } }
  );
}

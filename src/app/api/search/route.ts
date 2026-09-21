export const runtime = "edge";

import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { clients, services, invoices } from "@/db/schema";
import { like, or, desc } from "drizzle-orm";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const qLower = q.toLowerCase();

  // Empty query → return navigation only (quick actions)
  if (q.length === 0) {
    return Response.json({
      clients: [],
      services: [],
      invoices: [],
      navigation: getNavigationFiltered(""),
    });
  }

  if (q.length < 2) {
    // Avoid heavy queries for 1 char; still return nav filtered
    return Response.json({
      clients: [],
      services: [],
      invoices: [],
      navigation: getNavigationFiltered(qLower),
    });
  }

  const likePattern = `%${q}%`;

  // Parallel queries for clients/services, plus invoices enriched filter in JS
  const [matchedClients, matchedServices] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        status: clients.status,
        contactInfo: clients.contactInfo,
        websiteUrl: clients.websiteUrl,
      })
      .from(clients)
      .where(
        or(
          like(clients.name, likePattern),
          like(clients.contactInfo, likePattern),
          like(clients.websiteUrl, likePattern),
          like(clients.status, likePattern)
        )
      )
      .limit(5),
    db
      .select({
        id: services.id,
        name: services.name,
        basePrice: services.basePrice,
        description: services.description,
      })
      .from(services)
      .where(or(like(services.name, likePattern), like(services.description, likePattern)))
      .limit(5),
  ]);

  // Invoices: enrich with client/service names then filter in JS (covers joined fields)
  const [allInvoices, clientRows, serviceRows] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(50),
    db.select({ id: clients.id, name: clients.name }).from(clients),
    db.select({ id: services.id, name: services.name }).from(services),
  ]);

  const clientMap = new Map(clientRows.map((c) => [c.id, c.name]));
  const serviceMap = new Map(serviceRows.map((s) => [s.id, s.name]));

  const enriched = allInvoices.map((inv) => ({
    id: inv.id,
    clientId: inv.clientId,
    serviceId: inv.serviceId,
    clientName: clientMap.get(inv.clientId) ?? `Klien #${inv.clientId}`,
    serviceName: serviceMap.get(inv.serviceId) ?? `Layanan #${inv.serviceId}`,
    totalAmount: inv.totalAmount,
    status: inv.status,
    dueDate: inv.dueDate,
  }));

  const filteredInvoices = enriched
    .filter((inv) => {
      return (
        inv.clientName.toLowerCase().includes(qLower) ||
        inv.serviceName.toLowerCase().includes(qLower) ||
        inv.status.toLowerCase().includes(qLower) ||
        String(inv.id).includes(qLower) ||
        String(inv.totalAmount).includes(qLower)
      );
    })
    .slice(0, 5);

  return Response.json({
    clients: matchedClients,
    services: matchedServices,
    invoices: filteredInvoices,
    navigation: getNavigationFiltered(qLower),
  });
}

function getNavigationFiltered(qLower: string) {
  const allNav = [
    { label: "Ringkasan — Dashboard", href: "/dashboard", desc: "Ringkasan agensi & chart" },
    { label: "Klien & Prospek", href: "/dashboard/clients", desc: "Daftar klien & prospek" },
    { label: "Layanan Agensi", href: "/dashboard/services", desc: "Katalog paket layanan" },
    { label: "Tagihan", href: "/dashboard/invoices", desc: "Daftar tagihan & pembayaran" },
  ];
  if (!qLower) return allNav;
  return allNav.filter(
    (n) => n.label.toLowerCase().includes(qLower) || n.href.toLowerCase().includes(qLower) || n.desc.toLowerCase().includes(qLower)
  );
}

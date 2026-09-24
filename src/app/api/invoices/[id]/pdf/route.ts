import { auth } from "@clerk/nextjs/server";

// Endpoint ini sebelumnya generate PDF server-side via jsPDF.
// jsPDF 9.6MB membuat Cloudflare Worker crash (Internal Server Error).
// Sekarang PDF digenerate 100% client-side via src/lib/invoice-pdf.ts + /pdf-data.
// Endpoint ini dipertahankan sebagai stub agar tidak 404, mengembalikan 410 + instruksi.

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  return Response.json(
    {
      error: "Endpoint /pdf dinonaktifkan di Cloudflare Workers",
      hint: `Gunakan GET /api/invoices/${id}/pdf-data lalu generate client-side via src/lib/invoice-pdf.ts (downloadInvoicePdf)`,
      alternative: `/api/invoices/${id}/pdf-data`,
    },
    { status: 410 }
  );
}

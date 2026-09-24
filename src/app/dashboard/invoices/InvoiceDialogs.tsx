"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Wallet, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createInvoice,
  addPayment,
  updateInvoice,
  deleteInvoice,
  type CreateInvoiceFormData,
  type UpdateInvoiceFormData,
  type AddPaymentFormData,
} from "./actions";

// ─── Shared helpers ─────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Create Invoice ─────────────────────────────────────────────────────────
const createInvoiceSchema = z.object({
  clientId: z.coerce.number({ message: "Pilih klien" }).int().positive("Pilih klien"),
  serviceId: z.coerce.number({ message: "Pilih layanan" }).int().positive("Pilih layanan"),
  totalAmount: z.coerce
    .number({ message: "Total harus berupa angka" })
    .positive("Total harus lebih dari 0"),
  dueDate: z.string().optional().or(z.literal("")),
});

type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>;

type DealClient = { id: number; name: string };
type ServiceOpt = { id: number; name: string; basePrice: number };

export function CreateInvoiceDialog({
  dealClients,
  services,
}: {
  dealClients: DealClient[];
  services: ServiceOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateInvoiceValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createInvoiceSchema) as any,
    defaultValues: {
      clientId: undefined as unknown as number,
      serviceId: undefined as unknown as number,
      totalAmount: 0,
      dueDate: "",
    },
  });

  const watchedServiceId = form.watch("serviceId");

  // Auto-fill totalAmount when service changes
  useEffect(() => {
    if (!watchedServiceId) return;
    const svc = services.find((s) => s.id === Number(watchedServiceId));
    if (svc) form.setValue("totalAmount", svc.basePrice, { shouldValidate: true });
  }, [watchedServiceId, services, form]);

  function onSubmit(values: CreateInvoiceValues) {
    startTransition(async () => {
      const result = await createInvoice(values as CreateInvoiceFormData);
      if (result.success) {
        toast.success(result.message);
        form.reset({
          clientId: undefined as unknown as number,
          serviceId: undefined as unknown as number,
          totalAmount: 0,
          dueDate: "",
        });
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const disabled = dealClients.length === 0 || services.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            id="create-invoice-button"
            disabled={disabled}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm disabled:opacity-50"
          />
        }
      >
        <Plus className="w-4 h-4" />
        Buat Tagihan
      </DialogTrigger>

      <DialogContent
        id="create-invoice-dialog"
        className="bg-white border-slate-200 text-slate-900 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-xl">Buat Tagihan Baru</DialogTitle>
          <DialogDescription className="text-slate-500">
            Pilih klien (hanya status <span className="text-emerald-600 font-medium">DEAL</span>) dan layanan. Total bisa disesuaikan.
          </DialogDescription>
        </DialogHeader>

        {(dealClients.length === 0 || services.length === 0) && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            {dealClients.length === 0 && <p>• Belum ada klien dengan status DEAL.</p>}
            {services.length === 0 && <p>• Belum ada layanan. Buat layanan dulu di halaman Layanan.</p>}
          </div>
        )}

        <Form {...form}>
          <form id="create-invoice-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Klien <span className="text-red-400">*</span></FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-900">
                        <SelectValue placeholder="Pilih klien DEAL" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dealClients.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service */}
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Layanan <span className="text-red-400">*</span></FormLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-900">
                        <SelectValue placeholder="Pilih layanan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} — {formatCurrency(s.basePrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total */}
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Total Tagihan (IDR) <span className="text-red-400">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      placeholder="1500000"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/50"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : e.target.valueAsNumber;
                        field.onChange(Number.isNaN(val) ? 0 : val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Jatuh Tempo</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                Batal
              </Button>
              <Button type="submit" disabled={isPending || disabled} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0">
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Plus className="w-4 h-4" /> Buat Tagihan</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pay / Installment Dialog ───────────────────────────────────────────────
const paySchema = z.object({
  amountPaid: z.coerce.number({ message: "Jumlah harus berupa angka" }).positive("Jumlah harus > 0"),
  paymentDate: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
  proofUrl: z.string().max(500).optional().or(z.literal("")),
});

type PayValues = z.infer<typeof paySchema>;

export function PaymentDialog({
  invoice,
}: {
  invoice: {
    id: number;
    totalAmount: number;
    paidTotal: number;
    remaining: number;
    status: string;
    clientName: string;
    serviceName: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PayValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(paySchema) as any,
    defaultValues: {
      amountPaid: invoice.remaining > 0 ? invoice.remaining : 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "",
      note: "",
      proofUrl: "",
    },
  });

  // Reset amount when dialog opens (remaining may change after revalidation)
  useEffect(() => {
    if (open) {
      form.reset({
        amountPaid: invoice.remaining > 0 ? invoice.remaining : 0,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "",
        note: "",
        proofUrl: "",
      });
    }
  }, [open, invoice.remaining, form]);

  function onSubmit(values: PayValues) {
    startTransition(async () => {
      const result = await addPayment({
        invoiceId: invoice.id,
        ...values,
      } as AddPaymentFormData);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const isPaid = invoice.status === "PAID" || invoice.remaining <= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            disabled={isPaid}
            className="gap-1.5 h-7 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
          />
        }
      >
        <Wallet className="w-3.5 h-3.5" />
        {isPaid ? "Lunas" : "Bayar/Cicil"}
      </DialogTrigger>

      <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-lg">Catat Pembayaran</DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            {invoice.clientName} — {invoice.serviceName}
            <br />
            Total: <span className="font-medium text-slate-900">{formatCurrency(invoice.totalAmount)}</span>
            {" · "}Terbayar: <span className="font-medium text-emerald-600">{formatCurrency(invoice.paidTotal)}</span>
            {" · "}Sisa: <span className="font-bold text-rose-600">{formatCurrency(invoice.remaining)}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amountPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Jumlah Bayar (IDR) <span className="text-red-400">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={invoice.remaining}
                      step={1}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : e.target.valueAsNumber;
                        field.onChange(Number.isNaN(val) ? 0 : val);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-400">Maksimal {formatCurrency(invoice.remaining)}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Tanggal</FormLabel>
                    <FormControl>
                      <Input type="date" className="bg-slate-50 border-slate-200 text-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Metode</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-900">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="QRIS">QRIS</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Catatan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="No. referensi, keterangan..." rows={2} className="bg-slate-50 border-slate-200 text-slate-900 resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proofUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Bukti Bayar (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://... (R2/Cloudflare Images URL)" className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400" {...field} />
                  </FormControl>
                  <p className="text-xs text-slate-400">Siap untuk unggah R2 — masukkan URL file jika sudah upload.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="text-slate-500 hover:bg-slate-100">
                Batal
              </Button>
              <Button type="submit" disabled={isPending || isPaid} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Wallet className="w-4 h-4" /> Simpan Pembayaran</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Invoice Dialog ──────────────────────────────────────────────────
const editInvoiceSchema = z.object({
  clientId: z.coerce.number({ message: "Pilih klien" }).int().positive("Pilih klien"),
  serviceId: z.coerce.number({ message: "Pilih layanan" }).int().positive("Pilih layanan"),
  totalAmount: z.coerce.number({ message: "Total harus berupa angka" }).positive("Total harus lebih dari 0"),
  dueDate: z.string().optional().or(z.literal("")),
});

type EditInvoiceValues = z.infer<typeof editInvoiceSchema>;

export function EditInvoiceDialog({
  invoice,
  dealClients,
  services,
}: {
  invoice: {
    id: number;
    clientId: number;
    serviceId: number;
    totalAmount: number;
    dueDate: string | null;
    clientName: string;
    serviceName: string;
  };
  dealClients: DealClient[];
  services: ServiceOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Pastikan klien & layanan saat ini tetap ada di opsi meski status berubah
  const clientOptions = (() => {
    const exists = dealClients.some((c) => c.id === invoice.clientId);
    if (exists) return dealClients;
    return [...dealClients, { id: invoice.clientId, name: invoice.clientName }];
  })();

  const serviceOptions = (() => {
    const exists = services.some((s) => s.id === invoice.serviceId);
    if (exists) return services;
    return [...services, { id: invoice.serviceId, name: invoice.serviceName, basePrice: invoice.totalAmount }];
  })();

  const form = useForm<EditInvoiceValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(editInvoiceSchema) as any,
    defaultValues: {
      clientId: invoice.clientId,
      serviceId: invoice.serviceId,
      totalAmount: invoice.totalAmount,
      dueDate: invoice.dueDate || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        clientId: invoice.clientId,
        serviceId: invoice.serviceId,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate || "",
      });
    }
  }, [open, invoice, form]);

  function onSubmit(values: EditInvoiceValues) {
    startTransition(async () => {
      const result = await updateInvoice(invoice.id, values as UpdateInvoiceFormData);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            aria-label={`Edit tagihan ${invoice.clientName}`}
          />
        }
      >
        <Pencil className="w-3.5 h-3.5" />
      </DialogTrigger>

      <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-xl">Edit Tagihan</DialogTitle>
          <DialogDescription className="text-slate-500">
            Perbarui klien, layanan, total, atau jatuh tempo. Status akan menyesuaikan otomatis dari pembayaran yang sudah ada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Klien <span className="text-red-400">*</span></FormLabel>
                  <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-900">
                        <SelectValue placeholder="Pilih klien" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientOptions.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Layanan <span className="text-red-400">*</span></FormLabel>
                  <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-900">
                        <SelectValue placeholder="Pilih layanan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceOptions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name} — {formatCurrency(s.basePrice)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Total Tagihan (IDR) <span className="text-red-400">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-blue-500/50"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : e.target.valueAsNumber;
                        field.onChange(Number.isNaN(val) ? 0 : val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Jatuh Tempo</FormLabel>
                  <FormControl>
                    <Input type="date" className="bg-slate-50 border-slate-200 text-slate-900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} className="text-slate-500 hover:bg-slate-100">
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0">
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <>Simpan Perubahan</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Invoice Button ────────────────────────────────────────────────
export function DeleteInvoiceButton({ id, clientName }: { id: number; clientName: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Hapus tagihan untuk "${clientName}"? Semua cicilan terkait akan ikut terhapus. Tindakan tidak dapat dibatalkan.`)) return;
    startTransition(async () => {
      const result = await deleteInvoice(id);
      if (result.success) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
      aria-label={`Hapus tagihan ${clientName}`}
    >
      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </button>
  );
}

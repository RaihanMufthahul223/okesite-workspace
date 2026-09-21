"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, Pencil } from "lucide-react";
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
  addService,
  updateService,
  type ServiceFormData,
} from "./actions";
import type { Service } from "@/db/schema";

const formSchema = z.object({
  name: z.string().min(1, "Nama layanan wajib diisi").max(100),
  basePrice: z
    .number({ message: "Harga harus berupa angka" })
    .positive("Harga harus lebih dari 0"),
  description: z.string().max(500).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Add Service Dialog ───────────────────────────────────────────────────────
export function AddServiceDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      basePrice: 0,
      description: "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await addService(values as ServiceFormData);
      if (result.success) {
        toast.success(result.message);
        form.reset();
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
          <Button
            id="add-service-button"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm transition-all duration-200"
          />
        }
      >
        <Plus className="w-4 h-4" />
        Tambah Layanan
      </DialogTrigger>

      <DialogContent
        id="add-service-dialog"
        className="bg-white border-slate-200 text-slate-900 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-xl">
            Tambah Layanan Baru
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Tambahkan paket atau layanan baru untuk agensi Anda.
          </DialogDescription>
        </DialogHeader>

        <ServiceForm
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          submitLabel="Tambah Layanan"
          formId="add-service-form"
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Service Dialog ──────────────────────────────────────────────────────
export function EditServiceDialog({ service }: { service: Service }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service.name,
      basePrice: service.basePrice,
      description: service.description || "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateService(
        service.id,
        values as ServiceFormData
      );
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
            aria-label={`Edit ${service.name}`}
          />
        }
      >
        <Pencil className="w-3.5 h-3.5" />
      </DialogTrigger>

      <DialogContent
        id={`edit-service-dialog-${service.id}`}
        className="bg-white border-slate-200 text-slate-900 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-xl">
            Edit Layanan
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Perbarui detail layanan &ldquo;{service.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <ServiceForm
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          submitLabel="Simpan Perubahan"
          formId={`edit-service-form-${service.id}`}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Shared Form Component ───────────────────────────────────────────────────
function ServiceForm({
  form,
  onSubmit,
  isPending,
  submitLabel,
  formId,
  onCancel,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  onSubmit: (values: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
  formId: string;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                Nama Layanan <span className="text-rose-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: Website Company Profile"
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Base Price */}
        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                Harga Dasar (IDR) <span className="text-rose-500">*</span>
              </FormLabel>
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

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Deskripsi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Deskripsi singkat tentang layanan ini..."
                  rows={3}
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/50 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

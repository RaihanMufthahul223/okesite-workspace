"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
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

import { addClient, type AddClientFormData } from "./actions";

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  contactInfo: z.string().max(200).optional().or(z.literal("")),
  websiteUrl: z
    .string()
    .url("Harus berupa URL yang valid (termasuk https://)")
    .or(z.literal(""))
    .optional(),
  renewalDate: z.string().optional().or(z.literal("")),
  lastNote: z.string().max(500).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contactInfo: "",
      websiteUrl: "",
      renewalDate: "",
      lastNote: "",
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await addClient(values as AddClientFormData);
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
            id="add-lead-button"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm transition-all duration-200"
          />
        }
      >
        <Plus className="w-4 h-4" />
        Tambah Prospek
      </DialogTrigger>

      <DialogContent
        id="add-lead-dialog"
        className="bg-white border-slate-200 text-slate-900 sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-xl">Tambah Prospek Baru</DialogTitle>
          <DialogDescription className="text-slate-500">
            Tambahkan prospek atau klien baru. Status default adalah{" "}
            <span className="text-blue-600 font-medium">Follow Up</span>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="add-lead-form"
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
                    Nama <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="lead-name"
                      placeholder="Nama klien atau perusahaan"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Info */}
            <FormField
              control={form.control}
              name="contactInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Info Kontak</FormLabel>
                  <FormControl>
                    <Input
                      id="lead-contact"
                      placeholder="Telepon, email, atau WhatsApp"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website URL */}
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">URL Website</FormLabel>
                  <FormControl>
                    <Input
                      id="lead-website"
                      placeholder="https://example.com"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Renewal Date */}
            <FormField
              control={form.control}
              name="renewalDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    Tanggal Perpanjangan Website
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="lead-renewal"
                      type="date"
                      className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/50 "
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="lastNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      id="lead-note"
                      placeholder="Konteks apa pun tentang prospek ini..."
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
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              >
                Batal
              </Button>
              <Button
                id="add-lead-submit"
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
                  <>
                    <Plus className="w-4 h-4" />
                    Tambah Prospek
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


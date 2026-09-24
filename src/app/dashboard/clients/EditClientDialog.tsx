"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Loader2 } from "lucide-react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateClient, type UpdateClientFormData } from "./actions";
import type { Client } from "@/db/schema";

const formSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  contactInfo: z.string().max(200).optional().or(z.literal("")),
  websiteUrl: z.string().optional().or(z.literal("")),
  renewalDate: z.string().optional().or(z.literal("")),
  lastNote: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["FOLLOW_UP", "DEAL", "REJECT"]),
});

type FormValues = z.infer<typeof formSchema>;

export function EditClientDialog({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: client.name,
      contactInfo: client.contactInfo || "",
      websiteUrl: client.websiteUrl || "",
      renewalDate: client.renewalDate || "",
      lastNote: client.lastNote || "",
      status: client.status,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: client.name,
        contactInfo: client.contactInfo || "",
        websiteUrl: client.websiteUrl || "",
        renewalDate: client.renewalDate || "",
        lastNote: client.lastNote || "",
        status: client.status,
      });
    }
  }, [open, client, form]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateClient(client.id, values as UpdateClientFormData);
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            aria-label={`Edit ${client.name}`}
          />
        }
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </DialogTrigger>
      <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900 text-xl">Edit Klien</DialogTitle>
          <DialogDescription className="text-slate-500">
            Perbarui data klien. URL akan otomatis ditambahkan <span className="font-medium">https://</span> jika belum ada.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">
                    Nama <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-slate-50 border-slate-200 text-slate-900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Kontak</FormLabel>
                    <FormControl>
                      <Input placeholder="WA / email" className="bg-slate-50 border-slate-200 text-slate-900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-900">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                        <SelectItem value="DEAL">Deal</SelectItem>
                        <SelectItem value="REJECT">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="okesite.com atau https://..." className="bg-slate-50 border-slate-200 text-slate-900" {...field} />
                  </FormControl>
                  <p className="text-xs text-slate-400">Bisa tanpa https:// — akan otomatis dilengkapi.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="renewalDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Tanggal Perpanjangan</FormLabel>
                  <FormControl>
                    <Input type="date" className="bg-slate-50 border-slate-200 text-slate-900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold text-xs uppercase tracking-wider">Catatan</FormLabel>
                  <FormControl>
                    <Textarea rows={3} className="bg-slate-50 border-slate-200 text-slate-900 resize-none" {...field} />
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
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>Simpan Perubahan</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

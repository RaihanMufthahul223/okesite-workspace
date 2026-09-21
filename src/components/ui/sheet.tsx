"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";

// ─── Sheet Root ───────────────────────────────────────────────────────────────
function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />;
}

// ─── Sheet Trigger ────────────────────────────────────────────────────────────
function SheetTrigger({ render, children, ...props }: DialogPrimitive.Trigger.Props) {
  return (
    <DialogPrimitive.Trigger render={render} {...props}>
      {children}
    </DialogPrimitive.Trigger>
  );
}

// ─── Sheet Portal ─────────────────────────────────────────────────────────────
function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal {...props} />;
}

// ─── Sheet Close ──────────────────────────────────────────────────────────────
function SheetClose({ render, children, ...props }: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close render={render} {...props}>
      {children}
    </DialogPrimitive.Close>
  );
}

// ─── Sheet Overlay ────────────────────────────────────────────────────────────
function SheetOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        "duration-200",
        className
      )}
      {...props}
    />
  );
}

// ─── Sheet Content (slides from left or right) ─────────────────────────
interface SheetContentProps extends DialogPrimitive.Popup.Props {
  side?: "left" | "right";
}

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: SheetContentProps) {
  const sideStyles =
    side === "right"
      ? "top-0 right-0 h-full w-full sm:w-[480px] data-open:slide-in-from-right data-closed:slide-out-to-right"
      : "top-0 left-0 h-full w-72 data-open:slide-in-from-left data-closed:slide-out-to-left";

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        className={cn(
          "fixed z-50 bg-white shadow-2xl flex flex-col overflow-y-auto duration-200 ease-out border-slate-200",
          sideStyles,
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6 border-b border-slate-100", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-lg font-semibold text-slate-900 tracking-tight", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};


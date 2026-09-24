import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ServiceWorkerRegister, PWAInstallBanner } from "@/components/PWAInstall";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OkeSite CRM",
    template: "%s — OkeSite CRM",
  },
  description: "CRM Internal & Pelacak Keuangan untuk Agensi Web OkeSite — install di HP untuk akses cepat.",
  applicationName: "OkeSite CRM",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "OkeSite CRM",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="id"
        className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <head>
          {/* PWA: explicit links for iOS & legacy */}
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <ServiceWorkerRegister />
          {children}
          <PWAInstallBanner />
          <Toaster richColors position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}

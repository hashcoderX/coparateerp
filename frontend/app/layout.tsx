import type { Metadata, Viewport } from "next";
import "./globals.css";
import DisableZoom from "./ui/disable-zoom";

export const metadata: Metadata = {
  title: "Ceylon ERP",
  description: "Ceylon ERP - Business Management System",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ceylon ERP",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/icon-192.svg", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-dvh w-full overflow-x-hidden" suppressHydrationWarning>
        <DisableZoom />
        {children}
      </body>
    </html>
  );
}

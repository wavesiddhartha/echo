import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";
import { ToastContainer } from "@/components/ui/ToastContainer";

export const metadata: Metadata = {
  title: "Echo — Reply before they wonder.",
  description:
    "A gentle reminder app to reply to the people in your life. Because silence isn't what you meant.",
  keywords: ["reply reminder", "message reminder", "echo app"],
  authors: [{ name: "Echo" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Echo",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Echo",
    description: "Reply before they wonder.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0A",
  viewportFit: "cover",
};

import { DemoShell } from "@/components/ui/DemoShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Theme init script — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('echo-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ServiceWorkerRegistrar />
          <DemoShell>{children}</DemoShell>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}

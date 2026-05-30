import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TradingJournalProvider } from "@/components/TradingJournalProvider";

export const metadata: Metadata = {
  title: "Gold Journal — Forex Trading Tracker",
  description: "Professional trading journal for XAUUSD gold traders",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-['Syne',sans-serif] antialiased">
        <TradingJournalProvider>{children}</TradingJournalProvider>
      </body>
    </html>
  );
}

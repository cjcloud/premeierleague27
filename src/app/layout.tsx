import type { Metadata, Viewport } from "next";
import { Toaster } from '@/components/ui/toaster';
import { Inter } from "next/font/google";
import "./globals.css";
import "./layout.css";
import Header from "@/components/header";
import { getSafeSession } from '@/lib/session';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Premier League Predictions 2026/27",
  description: "Predict the final 2026/27 Premier League standings and track your score on the leaderboard.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use cached session to prevent memory leaks
  const session = await getSafeSession();

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Header session={session} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

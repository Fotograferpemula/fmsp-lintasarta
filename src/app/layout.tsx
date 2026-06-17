import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FMSP Lintasarta — Facility Management Service Platform",
  description: "Platform manajemen fasilitas terpusat Lintasarta untuk pemantauan aset, kepatuhan dokumen legalitas, dan notifikasi otomatis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/lintasarta-icon.png" type="image/png" />
        <meta name="theme-color" content="#070E1B" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from '@/components/AppLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhoenixD Lightning Client",
  description: "Modern Lightning Network management interface for PhoenixD",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover"
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" }
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PhoenixD"
  },
  formatDetection: {
    telephone: false
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-gray-50 dark:bg-gray-900 mobile-text mobile-scroll`}
      >
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}

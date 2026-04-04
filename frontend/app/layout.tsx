import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trivo — Plan together. Travel better.",
    template: "%s | Trivo",
  },
  description: "Group trips, done with calm. Anonymous budgets, shared tasks, AI synthesis — one place for everything.",
  applicationName: "Trivo",
  keywords: ["group travel", "trip planning", "travel coordination", "group trips"],
  openGraph: {
    title: "Trivo — Plan together. Travel better.",
    description: "Group trips, done with calm.",
    siteName: "Trivo",
    images: [{ url: "/icons/og-image.svg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trivo",
    description: "Group trips, done with calm.",
  },
  icons: {
    icon: "/icons/trivo-icon.svg",
    apple: "/icons/trivo-icon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ff8a6b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${fraunces.variable} ${dmSans.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

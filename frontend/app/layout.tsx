import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// "The Cartography of a Trip" — three voices, three jobs. Never mix them.
// Display: Playfair Display — headlines + the italic-vermillion emphasis word.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body: Source Serif 4 — prose, descriptions, anything read in sentences.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

// Marginalia: IBM Plex Mono — all map chrome. Always UPPERCASE + tracked wide.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trivo-argaur.vercel.app"),
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
  themeColor: "#cf3b16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font variables live on <html>, not <body>: the token stacks in
    // globals.css (--serif/--body/--mono) are defined on :root and resolve
    // var(--font-*) there — on <body> they'd be invisible to :root and the
    // whole font stack would compute to invalid.
    <html lang="en" className={`${playfair.variable} ${sourceSerif.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <script src="/analytics.js" defer />
      </body>
    </html>
  );
}

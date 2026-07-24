"use client"

import { signIn, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Contours } from "@/components/Contours"

const EDITORIAL_QUOTES = [
  { text: "Group travel is where memory is made at scale.", attr: "Field note" },
  { text: "The best trips are planned by consensus, not committee.", attr: "Field note" },
  { text: "Logistics are temporary. Moments are permanent.", attr: "Field note" },
]

/* Compass-rose wordmark — the Trivo mark */
function TrivoMark({ size = 22, tone = "currentColor" }: { size?: number; tone?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
      <circle cx="11" cy="11" r="9.6" fill="none" stroke={tone} strokeWidth="1.6" />
      <path d="M11 3.4 L13 11 L11 18.6 L9 11 Z" fill="var(--accent)" />
      <circle cx="11" cy="11" r="1.5" fill={tone} />
    </svg>
  )
}

export default function SignInPage() {
  const router = useRouter()
  const { status } = useSession()

  // Stable quote for SSR + first client render (no hydration mismatch);
  // rotate to a random one only after mount.
  const [quote, setQuote] = useState(EDITORIAL_QUOTES[0])
  useEffect(() => {
    setQuote(EDITORIAL_QUOTES[Math.floor(Math.random() * EDITORIAL_QUOTES.length)])
  }, [])

  const callbackUrl =
    typeof window === "undefined"
      ? "/dashboard"
      : new URLSearchParams(window.location.search).get("callbackUrl") ?? "/dashboard"

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl)
    }
  }, [status, router, callbackUrl])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "var(--paper)" }}>
      {/* Left panel — editorial, ink ground */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        {/* Graph-paper grid, masked */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(242,235,219,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(242,235,219,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            WebkitMaskImage: "radial-gradient(120% 100% at 30% 20%, #000 30%, transparent 82%)",
            maskImage: "radial-gradient(120% 100% at 30% 20%, #000 30%, transparent 82%)",
          }}
        />

        {/* Wordmark */}
        <div className="relative z-10 flex items-center gap-3">
          <TrivoMark tone="var(--paper)" />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: "15px",
              letterSpacing: "0.34em",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Trivo
          </span>
        </div>

        {/* Editorial quote */}
        <div className="relative z-10 space-y-5">
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "var(--accent)",
              fontWeight: 700,
            }}
          >
            ◆ Field guide to group travel
          </span>
          <blockquote
            className="text-[30px] leading-[1.25]"
            style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 500 }}
          >
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(242,235,219,0.45)",
            }}
          >
            — {quote.attr}
          </p>
        </div>

        {/* Bottom coordinate strip */}
        <div
          className="relative z-10"
          style={{
            fontFamily: "var(--mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "rgba(242,235,219,0.4)",
          }}
        >
          26.9124° N · 75.7873° E · Sheet 1 of 1
        </div>
      </div>

      {/* Right panel — auth */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
        <Contours fixed />

        {/* Mobile wordmark */}
        <div className="lg:hidden mb-10 flex items-center gap-3 relative z-10">
          <TrivoMark tone="var(--ink)" />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: "15px",
              letterSpacing: "0.34em",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--ink)",
            }}
          >
            Trivo
          </span>
        </div>

        <div className="w-full max-w-[380px] relative z-10">
          <span className="fig-tag" style={{ marginBottom: 22 }}>
            <b>FIG. 0</b> Board the expedition
          </span>

          <h1
            className="text-[34px] leading-tight mt-4"
            style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
          >
            Plan together.
            <br />
            <i style={{ color: "var(--accent)" }}>Travel better.</i>
          </h1>
          <p className="text-[15px] mt-4" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
            Anonymous preferences. Shared decisions. Zero group-chat chaos.
          </p>

          <div className="mt-9">
            <button
              className="cta w-full"
              onClick={() => signIn("google", { callbackUrl })}
            >
              {/* Google logo SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" fillOpacity=".9"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" fillOpacity=".7"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" fillOpacity=".55"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" fillOpacity=".4"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p
            className="mt-6 text-center leading-relaxed"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-40)",
            }}
          >
            By continuing, you agree to Trivo&apos;s terms.
            <br />
            Your preferences stay anonymous from the group.
          </p>
        </div>
      </div>
    </div>
  )
}

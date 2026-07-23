"use client"

import { signIn, useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

const EDITORIAL_QUOTES = [
  { text: "Group travel is where memory is made at scale.", attr: "Unknown" },
  { text: "The best trips are planned by consensus, not committee.", attr: "Unknown" },
  { text: "Logistics are temporary. Moments are permanent.", attr: "Unknown" },
]

const quote = EDITORIAL_QUOTES[Math.floor(Math.random() * EDITORIAL_QUOTES.length)]

export default function SignInPage() {
  const router = useRouter()
  const { status } = useSession()
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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col lg:flex-row">
      {/* Left panel — editorial */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "var(--ink)" }}
      >
        {/* Texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
            backgroundSize: "8px 8px",
          }}
        />

        {/* Logo mark */}
        <div className="relative z-10">
          <p
            className="gradient-text text-[22px]"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
            }}
          >
            Trivo
          </p>
        </div>

        {/* Editorial quote */}
        <div className="relative z-10 space-y-4">
          <div
            className="w-8 h-[2px]"
            style={{ background: "var(--accent-coral)" }}
          />
          <blockquote
            className="text-[28px] leading-[1.3] text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
            }}
          >
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <p
            className="text-[12px] uppercase tracking-widest text-white/40"
            style={{ fontFamily: "var(--font-body)" }}
          >
            — {quote.attr}
          </p>
        </div>

        {/* Bottom accent */}
        <div className="relative z-10 flex gap-2">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "var(--accent-coral)" }}
          />
          <div
            className="w-4 h-1 rounded-full"
            style={{ background: "var(--accent-lilac)" }}
          />
          <div
            className="w-2 h-1 rounded-full"
            style={{ background: "var(--accent-pink)" }}
          />
        </div>
      </div>

      {/* Right panel — auth */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <p
            className="gradient-text text-[26px]"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
            }}
          >
            Trivo
          </p>
        </div>

        <div className="w-full max-w-[360px] space-y-8">
          <div>
            <h1
              className="text-[32px] leading-tight text-[var(--ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              Plan together.
              <br />
              Travel better.
            </h1>
            <p
              className="text-[14px] text-[var(--muted)] mt-3"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Anonymous preferences. Shared decisions. Zero group-chat chaos.
            </p>
          </div>

          <div className="space-y-3">
            <button
              className="w-full h-12 rounded-[4px] bg-[var(--ink)] text-white text-[14px] font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
              style={{ fontFamily: "var(--font-body)" }}
              onClick={() => signIn("google", { callbackUrl })}
            >
              {/* Google logo SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" fillOpacity=".85"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".7"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" fillOpacity=".55"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".4"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p
            className="text-[11px] text-[var(--muted)] text-center leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            By continuing, you agree to Trivo&apos;s terms.
            <br />
            Your preferences are always kept anonymous from the group.
          </p>
        </div>
      </div>
    </div>
  )
}

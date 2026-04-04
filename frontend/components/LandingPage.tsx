"use client"

import Link from "next/link"
import { useEffect, useRef, useCallback } from "react"

/* ── Scroll reveal hook ──────────────────────────────────────────────────────── */

function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const observe = useCallback((node: HTMLElement | null) => {
    if (!node) return
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-revealed", "true")
              observerRef.current?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
      )
    }
    observerRef.current.observe(node)
  }, [])

  useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  return observe
}

/* ── Inline SVG icons ────────────────────────────────────────────────────────── */

function TrivoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a6b" />
          <stop offset="100%" stopColor="#ff6b9a" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="#0f1222" />
      <rect x="128" y="168" width="256" height="28" rx="14" fill="url(#mark-g)" />
      <rect x="242" y="168" width="28" height="152" rx="14" fill="url(#mark-g)" />
      <circle cx="256" cy="348" r="34" fill="url(#mark-g)" />
      <circle cx="256" cy="348" r="16" fill="#0f1222" />
      <circle cx="128" cy="182" r="14" fill="url(#mark-g)" />
      <circle cx="384" cy="182" r="14" fill="url(#mark-g)" />
    </svg>
  )
}

function IconSurvey() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )
}

function IconSparkle() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8L5 17z" />
    </svg>
  )
}

function IconVote() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><path d="M7 8h10M7 11h6" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><circle cx="8" cy="15" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" /><circle cx="16" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconTask() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function IconExpense() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5a2.5 2.5 0 015 0c0 1.4-.8 2-2.5 2.5-1.7.5-2.5 1.1-2.5 2.5a2.5 2.5 0 005 0" />
    </svg>
  )
}

/* ── Navbar ──────────────────────────────────────────────────────────────────── */

function Navbar() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "rgba(15,18,34,0.82)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <TrivoMark size={36} />
          <span
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 22,
              color: "#ffffff",
              letterSpacing: "0.02em",
            }}
          >
            Trivo
          </span>
        </Link>

        {/* Nav links — desktop only */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
          className="hidden-mobile"
        >
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how-it-works" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 14,
                fontFamily: "var(--font-body), sans-serif",
                textDecoration: "none",
                transition: "color 150ms ease",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.9)")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/auth/signin?callbackUrl=/dashboard"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 14,
              fontFamily: "var(--font-body), sans-serif",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signin?callbackUrl=/trips/new"
            style={{
              background: "#ff8a6b",
              color: "#0f1222",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-body), sans-serif",
              padding: "9px 20px",
              borderRadius: 6,
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section
      className="grain-overlay"
      style={{
        background: "#0f1222",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "80px 24px 80px",
      }}
    >
      {/* Atmosphere orbs */}
      <div
        className="animate-pulse-glow"
        style={{
          position: "absolute",
          top: -160,
          left: -80,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,138,107,0.22) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div
        className="animate-pulse-glow"
        style={{
          position: "absolute",
          bottom: -80,
          right: -100,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(154,140,255,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          animationDelay: "2s",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "38%",
          right: "18%",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,154,0.1) 0%, transparent 70%)",
          filter: "blur(32px)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ maxWidth: 720 }}>
          {/* Eyebrow */}
          <p
            className="animate-fade-up"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.28)",
              marginBottom: 24,
              textTransform: "uppercase",
            }}
          >
            28°36&apos;N 77°13&apos;E — GROUP TRAVEL
          </p>

          {/* Hero wordmark */}
          <h1
            className="gradient-text animate-fade-up"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: "clamp(72px, 14vw, 172px)",
              lineHeight: 0.92,
              letterSpacing: "0.05em",
              marginBottom: 32,
              animationDelay: "60ms",
            }}
          >
            TRIVO
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-up"
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontSize: "clamp(18px, 2.2vw, 22px)",
              color: "rgba(255,255,255,0.72)",
              fontWeight: 400,
              lineHeight: 1.5,
              marginBottom: 8,
              animationDelay: "120ms",
            }}
          >
            Plan together. Travel better.
          </p>
          <p
            className="animate-fade-up"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(16px, 1.8vw, 20px)",
              color: "rgba(255,255,255,0.38)",
              marginBottom: 48,
              animationDelay: "160ms",
            }}
          >
            Group trips, done with calm.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 32,
              animationDelay: "220ms",
            }}
          >
            <Link
              href="/auth/signin?callbackUrl=/trips/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#ff8a6b",
                color: "#0f1222",
                fontFamily: "var(--font-body), sans-serif",
                fontWeight: 600,
                fontSize: 15,
                padding: "14px 28px",
                borderRadius: 8,
                textDecoration: "none",
                letterSpacing: "0.01em",
                boxShadow: "0 0 40px rgba(255,138,107,0.35)",
                transition: "opacity 150ms ease, box-shadow 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.9"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(255,138,107,0.5)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(255,138,107,0.35)"
              }}
            >
              Start planning free
              <span style={{ fontSize: 18 }}>→</span>
            </Link>
            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "var(--font-body), sans-serif",
                fontWeight: 400,
                fontSize: 15,
                color: "rgba(255,255,255,0.65)",
                padding: "14px 28px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.14)",
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "border-color 150ms ease, color 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"
                ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"
                ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"
              }}
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <p
            className="animate-fade-up"
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.22)",
              letterSpacing: "0.04em",
              animationDelay: "280ms",
            }}
          >
            Free to use · No credit card · Works on mobile
          </p>
        </div>

        {/* Floating feature cards — visible on large screens only */}
        <div className="hero-cards-container">
          {/* Card 1: Anonymous survey */}
          <div
            className="animate-float"
            style={{
              position: "absolute",
              top: -40,
              right: 40,
              width: 220,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "14px 16px",
              backdropFilter: "blur(12px)",
              "--float-rotate": "2deg",
            } as React.CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: "#ff8a6b",
                boxShadow: "0 0 8px rgba(255,138,107,0.6)",
              }} />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.1em", fontFamily: "var(--font-body), sans-serif" }}>ANONYMOUS SURVEY</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "var(--font-body), sans-serif", marginBottom: 10 }}>
              Budget range?
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {["₹3k–5k", "₹5k–8k", "₹8k+"].map((b, i) => (
                <span
                  key={b}
                  style={{
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: i === 1 ? "#ff8a6b" : "rgba(255,255,255,0.4)",
                    background: i === 1 ? "rgba(255,138,107,0.12)" : "transparent",
                    fontFamily: "var(--font-body), sans-serif",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 8, fontFamily: "var(--font-body), sans-serif" }}>
              Anonymous · 6 responses
            </p>
          </div>

          {/* Card 2: AI synthesis */}
          <div
            className="animate-float-slow"
            style={{
              position: "absolute",
              bottom: -60,
              right: 80,
              width: 240,
              background: "rgba(154,140,255,0.08)",
              border: "1px solid rgba(154,140,255,0.2)",
              borderRadius: 12,
              padding: "14px 16px",
              backdropFilter: "blur(12px)",
              "--float-rotate": "-1.5deg",
            } as React.CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>✦</span>
              <span style={{ color: "rgba(154,140,255,0.8)", fontSize: 10, letterSpacing: "0.1em", fontFamily: "var(--font-body), sans-serif" }}>AI SYNTHESIS</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.5, fontFamily: "var(--font-body), sans-serif", marginBottom: 8 }}>
              &ldquo;3 of 6 prefer the hills. Budget consensus at ₹5–7k.&rdquo;
            </p>
            <div style={{
              background: "rgba(154,140,255,0.15)",
              border: "1px solid rgba(154,140,255,0.2)",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 11,
              color: "#9a8cff",
              fontFamily: "var(--font-body), sans-serif",
            }}>
              ✦ 3 options generated
            </div>
          </div>

          {/* Card 3: Voting */}
          <div
            className="animate-float"
            style={{
              position: "absolute",
              top: 120,
              right: -10,
              width: 200,
              background: "rgba(255,107,154,0.06)",
              border: "1px solid rgba(255,107,154,0.18)",
              borderRadius: 12,
              padding: "14px 16px",
              backdropFilter: "blur(12px)",
              "--float-rotate": "1deg",
              animationDelay: "1s",
            } as React.CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff6b9a" }} />
              <span style={{ color: "rgba(255,107,154,0.8)", fontSize: 10, letterSpacing: "0.1em", fontFamily: "var(--font-body), sans-serif" }}>GROUP VOTE</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontFamily: "var(--font-body), sans-serif", marginBottom: 8 }}>
              Destination
            </p>
            {[
              { label: "Kasol, HP", pct: 67 },
              { label: "Coorg, KA", pct: 33 },
            ].map(({ label, pct }) => (
              <div key={label} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-body), sans-serif" }}>{label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,107,154,0.7)", fontFamily: "var(--font-body), sans-serif" }}>{pct}%</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#ff6b9a", borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-body), sans-serif" }}>SCROLL</span>
        <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)" }} />
      </div>
    </section>
  )
}

/* ── Problem section ─────────────────────────────────────────────────────────── */

function ProblemSection({ reveal }: { reveal: (node: HTMLElement | null) => void }) {
  const problems = [
    {
      num: "01",
      title: "Silent budget misalignment",
      body: "Nobody says ₹5k feels like a lot. So the expensive option gets picked, and three people quietly drop out. The trip dies before it starts.",
      accent: "#ff8a6b",
      delay: "reveal-delay-1",
    },
    {
      num: "02",
      title: "Organizer burnout",
      body: "One person makes 47 decisions via WhatsApp, chases 8 people for confirmations, and tracks expenses in a spreadsheet. Then they stop enjoying the trip.",
      accent: "#ff6b9a",
      delay: "reveal-delay-2",
    },
    {
      num: "03",
      title: "No single source of truth",
      body: "The plan lives in a chat. The budget lives in Sheets. The poll closed on Instagram. When details conflict, nobody knows which version is real.",
      accent: "#9a8cff",
      delay: "reveal-delay-3",
    },
  ]

  return (
    <section
      id="problems"
      style={{
        background: "var(--bg)",
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div ref={reveal} className="reveal" style={{ marginBottom: 64 }}>
          <p style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "var(--muted)",
            marginBottom: 16,
            textTransform: "uppercase",
          }}>
            The problem
          </p>
          <h2 style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(36px, 5vw, 56px)",
            color: "var(--ink)",
            lineHeight: 1.1,
            maxWidth: 600,
          }}>
            Three things kill every group trip.
          </h2>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {problems.map(({ num, title, body, accent, delay }) => (
            <div
              key={num}
              ref={reveal}
              className={`reveal ${delay}`}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderLeft: `3px solid ${accent}`,
                borderRadius: 4,
                padding: "32px 28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Ghost number */}
              <span style={{
                position: "absolute",
                top: 12,
                right: 20,
                fontFamily: "var(--font-display), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 80,
                color: `${accent}12`,
                lineHeight: 1,
                pointerEvents: "none",
                userSelect: "none",
              }}>
                {num}
              </span>
              <h3 style={{
                fontFamily: "var(--font-body), sans-serif",
                fontWeight: 600,
                fontSize: 16,
                color: "var(--ink)",
                marginBottom: 12,
                lineHeight: 1.3,
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 14,
                color: "var(--muted)",
                lineHeight: 1.7,
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── How It Works ────────────────────────────────────────────────────────────── */

function HowItWorksSection({ reveal }: { reveal: (node: HTMLElement | null) => void }) {
  const steps = [
    {
      num: "1",
      title: "Create & invite",
      body: "Set up your trip in 2 minutes. Share a link via WhatsApp — anyone with it can join instantly, no app install needed.",
      highlight: false,
    },
    {
      num: "2",
      title: "Everyone answers",
      body: "Each member fills a quick preference survey — budget range, trip style, dates. It's completely anonymous. No peer pressure.",
      highlight: false,
    },
    {
      num: "3",
      title: "AI synthesises, group votes",
      body: "Claude reads all preferences and generates specific vote options. Group votes, tasks get assigned, everyone stays aligned.",
      highlight: true,
    },
  ]

  return (
    <section
      id="how-it-works"
      className="grain-overlay"
      style={{
        background: "#0f1222",
        padding: "100px 24px",
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div ref={reveal} className="reveal" style={{ marginBottom: 72 }}>
          <p style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.28)",
            marginBottom: 16,
            textTransform: "uppercase",
          }}>
            How it works
          </p>
          <h2 style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(36px, 5vw, 56px)",
            color: "#ffffff",
            lineHeight: 1.1,
          }}>
            From &ldquo;let&apos;s go&rdquo; to packed bags.
          </h2>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 0,
            position: "relative",
          }}
        >
          {steps.map(({ num, title, body, highlight }, i) => (
            <div
              key={num}
              ref={reveal}
              className={`reveal reveal-delay-${i + 1}`}
              style={{
                padding: "40px 36px",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                position: "relative",
              }}
            >
              {/* Connecting dot on top border */}
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute",
                  top: 56,
                  right: -1,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "rgba(255,138,107,0.4)",
                  zIndex: 1,
                  transform: "translateX(50%)",
                }} />
              )}

              {/* Step number */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: highlight ? "2px solid #ff8a6b" : "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                background: highlight ? "rgba(255,138,107,0.1)" : "transparent",
              }}>
                <span style={{
                  fontFamily: "var(--font-display), Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 20,
                  fontWeight: 500,
                  color: highlight ? "#ff8a6b" : "rgba(255,255,255,0.5)",
                }}>
                  {num}
                </span>
              </div>

              <h3 style={{
                fontFamily: "var(--font-body), sans-serif",
                fontWeight: 600,
                fontSize: 17,
                color: "#ffffff",
                marginBottom: 12,
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 14,
                color: "rgba(255,255,255,0.48)",
                lineHeight: 1.7,
              }}>
                {body}
              </p>

              {/* Step tag */}
              <p style={{
                marginTop: 20,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.16)",
              }}>
                STEP 0{num}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div ref={reveal} className="reveal reveal-delay-4" style={{ marginTop: 72, textAlign: "center" }}>
          <Link
            href="/auth/signin?callbackUrl=/trips/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.75)",
              fontFamily: "var(--font-body), sans-serif",
              fontSize: 14,
              fontWeight: 500,
              padding: "12px 28px",
              borderRadius: 8,
              textDecoration: "none",
              transition: "background 150ms ease, color 150ms ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"
              ;(e.currentTarget as HTMLElement).style.color = "#ffffff"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"
            }}
          >
            Try it yourself →
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Features Grid ───────────────────────────────────────────────────────────── */

function FeaturesSection({ reveal }: { reveal: (node: HTMLElement | null) => void }) {
  const features = [
    {
      icon: <IconSurvey />,
      title: "Anonymous preference survey",
      body: "Budget, trip style, dates — collected without peer pressure. Everyone answers honestly when it's private.",
      accent: "#ff8a6b",
    },
    {
      icon: <IconSparkle />,
      title: "AI synthesis by Claude",
      body: "Claude reads 8 different opinions and distils them into 3 clear, actionable options. No more endless deliberation.",
      accent: "#9a8cff",
    },
    {
      icon: <IconVote />,
      title: "Group voting",
      body: "Anonymous ranked votes on destinations, dates, accommodation. Decisions happen without anyone feeling forced.",
      accent: "#ff6b9a",
    },
    {
      icon: <IconCalendar />,
      title: "RSVP + availability",
      body: "See who's going, who's maybe, and find the exact dates that work for the most people in the group.",
      accent: "#ff8a6b",
    },
    {
      icon: <IconTask />,
      title: "Task board",
      body: "Visas, hotels, bookings — assign to individuals, set deadlines, get push reminders. Coordination without Notion.",
      accent: "#9a8cff",
    },
    {
      icon: <IconExpense />,
      title: "Expense settlement",
      body: "Log shared costs, split them fairly, and get an optimised settlement plan. No more 'you owe me' threads.",
      accent: "#ff6b9a",
    },
  ]

  return (
    <section
      id="features"
      style={{ background: "var(--bg)", padding: "100px 24px" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div ref={reveal} className="reveal" style={{ marginBottom: 56 }}>
          <p style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "var(--muted)",
            marginBottom: 16,
            textTransform: "uppercase",
          }}>
            Features
          </p>
          <h2 style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(36px, 5vw, 56px)",
            color: "var(--ink)",
            lineHeight: 1.1,
          }}>
            Everything the group needs.
          </h2>
        </div>

        {/* Feature cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}>
          {features.map(({ icon, title, body, accent }, i) => (
            <div
              key={title}
              ref={reveal}
              className={`reveal reveal-delay-${(i % 3) + 1}`}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "24px 24px",
                transition: "transform 200ms ease, box-shadow 200ms ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(15,18,34,0.08)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: `${accent}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                color: accent,
              }}>
                {icon}
              </div>
              <h3 style={{
                fontFamily: "var(--font-body), sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: "var(--ink)",
                marginBottom: 8,
                lineHeight: 1.3,
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.7,
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── AI Difference ───────────────────────────────────────────────────────────── */

function AIDifferenceSection({ reveal }: { reveal: (node: HTMLElement | null) => void }) {
  return (
    <section style={{
      background: "var(--bg)",
      padding: "80px 24px",
      borderTop: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background accent */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(255,138,107,0.05) 0%, rgba(154,140,255,0.05) 100%)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 64,
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Text */}
        <div ref={reveal} className="reveal">
          <p style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "var(--muted)",
            marginBottom: 16,
            textTransform: "uppercase",
          }}>
            Powered by Claude
          </p>
          <h2 style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: "clamp(32px, 4vw, 48px)",
            color: "var(--ink)",
            lineHeight: 1.15,
            marginBottom: 24,
          }}>
            The AI that actually understands group dynamics.
          </h2>
          <p style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: 15,
            color: "var(--muted)",
            lineHeight: 1.7,
            marginBottom: 16,
          }}>
            When 8 people have 8 different opinions, Trivo doesn&apos;t average them — it reads between the lines. Claude finds the options everyone can live with, not just the most popular one.
          </p>
          <p style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: 15,
            color: "var(--muted)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}>
            From preference synthesis to vote option generation, the AI works in the background — so the group focuses on excitement, not logistics.
          </p>
          <Link
            href="/auth/signin?callbackUrl=/trips/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--ink)",
              color: "#ffffff",
              fontFamily: "var(--font-body), sans-serif",
              fontSize: 14,
              fontWeight: 500,
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            Try it free →
          </Link>
        </div>

        {/* AI summary card mockup */}
        <div ref={reveal} className="reveal reveal-delay-2">
          <div style={{
            background: "var(--ink)",
            borderRadius: 12,
            padding: "28px",
            boxShadow: "0 0 80px rgba(154,140,255,0.15), 0 24px 48px rgba(15,18,34,0.2)",
          }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(154,140,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>✦</div>
              <div>
                <p style={{ color: "#ffffff", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body), sans-serif" }}>AI Summary</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "var(--font-body), sans-serif" }}>6 preferences analysed</p>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 4,
                  background: "rgba(154,140,255,0.15)", color: "#9a8cff",
                  fontFamily: "var(--font-body), sans-serif", letterSpacing: "0.06em",
                }}>CLAUDE</span>
              </div>
            </div>

            {/* Anonymous preference bars */}
            <div style={{ marginBottom: 20 }}>
              {[
                { label: "Budget", value: "₹4k–7k consensus", fill: 0.72, color: "#ff8a6b" },
                { label: "Trip style", value: "Mountains preferred", fill: 0.58, color: "#9a8cff" },
                { label: "Duration", value: "4–5 days", fill: 0.85, color: "#ff6b9a" },
              ].map(({ label, value, fill, color }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-body), sans-serif" }}>{label}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "var(--font-body), sans-serif" }}>{value}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 2, background: color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />

            {/* Generated options */}
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.1em", marginBottom: 12, fontFamily: "var(--font-body), sans-serif" }}>GENERATED OPTIONS</p>
            {[
              { dest: "Kasol, Himachal Pradesh", badge: "Best fit" },
              { dest: "Chopta, Uttarakhand", badge: "Budget pick" },
              { dest: "Munnar, Kerala", badge: "Alternate" },
            ].map(({ dest, badge }, i) => (
              <div
                key={dest}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 6,
                  marginBottom: 6,
                  background: i === 0 ? "rgba(255,138,107,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${i === 0 ? "rgba(255,138,107,0.2)" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                <span style={{ fontSize: 13, color: i === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)", fontFamily: "var(--font-body), sans-serif" }}>{dest}</span>
                <span style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 3,
                  background: i === 0 ? "rgba(255,138,107,0.2)" : "rgba(255,255,255,0.05)",
                  color: i === 0 ? "#ff8a6b" : "rgba(255,255,255,0.3)",
                  fontFamily: "var(--font-body), sans-serif",
                }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Footer CTA ──────────────────────────────────────────────────────────────── */

function FooterCTASection({ reveal }: { reveal: (node: HTMLElement | null) => void }) {
  return (
    <section
      className="grain-overlay"
      style={{
        background: "#0f1222",
        padding: "120px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Atmosphere */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(255,138,107,0.12) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      <div ref={reveal} className="reveal" style={{ position: "relative", zIndex: 2 }}>
        <p style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 11,
          letterSpacing: "0.18em",
          color: "rgba(255,255,255,0.22)",
          marginBottom: 24,
          textTransform: "uppercase",
        }}>
          Start for free
        </p>
        <h2 style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(40px, 6vw, 72px)",
          color: "#ffffff",
          lineHeight: 1.1,
          marginBottom: 48,
          maxWidth: 720,
          margin: "0 auto 48px",
        }}>
          Your next group trip starts here.
        </h2>

        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <Link
            href="/auth/signin?callbackUrl=/trips/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#ff8a6b",
              color: "#0f1222",
              fontFamily: "var(--font-body), sans-serif",
              fontWeight: 600,
              fontSize: 16,
              padding: "16px 36px",
              borderRadius: 8,
              textDecoration: "none",
              letterSpacing: "0.01em",
              boxShadow: "0 0 60px rgba(255,138,107,0.4)",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            Plan your first trip →
          </Link>
          <Link
            href="/auth/signin?callbackUrl=/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--font-body), sans-serif",
              fontWeight: 400,
              fontSize: 16,
              color: "rgba(255,255,255,0.55)",
              padding: "16px 28px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>

        <p style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: 13,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.02em",
        }}>
          Continue with Google · Free forever · No credit card
        </p>
      </div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer style={{
      background: "#0f1222",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      padding: "48px 24px 32px",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 40,
        marginBottom: 40,
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrivoMark size={28} />
            <span style={{
              fontFamily: "var(--font-display), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 18,
              color: "rgba(255,255,255,0.55)",
            }}>Trivo</span>
          </div>
          <p style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.22)",
            fontFamily: "var(--font-body), sans-serif",
            lineHeight: 1.6,
            maxWidth: 240,
          }}>
            Group trips, done with calm.
          </p>
        </div>

        {/* Links */}
        <div style={{ display: "flex", gap: 64, flexWrap: "wrap" }}>
          <div>
            <p style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.22)",
              marginBottom: 16,
              fontFamily: "var(--font-body), sans-serif",
              textTransform: "uppercase",
            }}>Product</p>
            {["Features", "How it works"].map((label) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <a
                  href={`#${label.toLowerCase().replace(/ /g, "-")}`}
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.35)",
                    textDecoration: "none",
                    fontFamily: "var(--font-body), sans-serif",
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.35)")}
                >
                  {label}
                </a>
              </div>
            ))}
          </div>
          <div>
            <p style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.22)",
              marginBottom: 16,
              fontFamily: "var(--font-body), sans-serif",
              textTransform: "uppercase",
            }}>Legal</p>
            {["Privacy", "Terms"].map((label) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <a
                  href="#"
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.35)",
                    textDecoration: "none",
                    fontFamily: "var(--font-body), sans-serif",
                  }}
                >
                  {label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        paddingTop: 24,
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <p style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.18)",
          fontFamily: "var(--font-body), sans-serif",
        }}>
          © 2026 Trivo · Built for friend groups everywhere
        </p>
        <p style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.12)",
          fontFamily: "'Courier New', Courier, monospace",
          letterSpacing: "0.08em",
        }}>
          28°36&apos;N 77°13&apos;E
        </p>
      </div>
    </footer>
  )
}

/* ── Main component ──────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const reveal = useScrollReveal()

  return (
    <>
      <style>{`
        @media (max-width: 1099px) {
          .hero-cards-container { display: none !important; }
        }
        @media (min-width: 1100px) {
          .hero-cards-container {
            display: block;
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            bottom: 0;
          }
        }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
      <div style={{ overflowX: "hidden" }}>
        <Navbar />
        <HeroSection />
        <ProblemSection reveal={reveal} />
        <HowItWorksSection reveal={reveal} />
        <FeaturesSection reveal={reveal} />
        <AIDifferenceSection reveal={reveal} />
        <FooterCTASection reveal={reveal} />
        <Footer />
      </div>
    </>
  )
}

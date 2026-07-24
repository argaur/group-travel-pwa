"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Contours } from "@/components/Contours"

/* ═══════════════════════════════════════════════════════════════════════════
   TRIVO Landing — "The Cartography of a Trip"
   Expedition-map marketing page. Every graphic carries data; decoration cut.
   System classes live in app/globals.css; spec in DESIGN_CARTOGRAPHY.md.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Scroll reveal — .rv elements gain .in when they enter the viewport ────── */

function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const observe = useCallback((node: HTMLElement | null) => {
    if (!node) return
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in")
              observerRef.current?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
      )
    }
    observerRef.current.observe(node)
  }, [])

  useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  return observe
}

/* ── Compass-rose wordmark ─────────────────────────────────────────────────── */

function TrivoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="9.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 3.4 L13 11 L11 18.6 L9 11 Z" fill="var(--accent)" />
      <circle cx="11" cy="11" r="1.5" fill="currentColor" />
    </svg>
  )
}

/* ── Hero figure: compass + the plan drawing itself ────────────────────────────
   The dashed vermillion route is the trip plan forming: the pulsing dot is
   where this group is now (the idea), waypoints pop as decisions lock
   (dates, stay), and X is the booked trip. */

function HeroCompassRoute() {
  return (
    <svg viewBox="0 0 460 470" role="img" aria-label="Survey chart: a dotted route drawing itself from 'you are here — the idea' through locked dates and a chosen stay to an X marked 'booked', beside a compass rose">
      {/* Compass */}
      <g className="compass-ring" opacity=".9">
        <circle cx="230" cy="150" r="118" fill="none" stroke="var(--ink)" strokeWidth="1.4" />
        <circle
          cx="230"
          cy="150"
          r="98"
          fill="none"
          stroke="var(--ink)"
          strokeWidth=".8"
          strokeDasharray="2 5"
          opacity=".6"
        />
        <g stroke="var(--ink)" strokeWidth="1.4">
          <line x1="230" y1="30" x2="230" y2="46" />
          <line x1="230" y1="254" x2="230" y2="270" />
          <line x1="110" y1="150" x2="126" y2="150" />
          <line x1="334" y1="150" x2="350" y2="150" />
        </g>
      </g>
      <g fontFamily="var(--mono)" fontSize="13" fill="var(--ink)" textAnchor="middle" fontWeight="700">
        <text x="230" y="22">N</text>
        <text x="230" y="292">S</text>
        <text x="95" y="155">W</text>
        <text x="365" y="155">E</text>
      </g>
      {/* Needle (static — the party knows where it's pointing) */}
      <g>
        <path d="M230 62 L242 150 L230 238 L218 150 Z" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
        <path d="M230 62 L242 150 L230 150 Z" fill="var(--accent)" />
        <path d="M230 62 L218 150 L230 150 Z" fill="var(--ink)" />
        <circle cx="230" cy="150" r="5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
      </g>

      {/* The plan, drawing itself */}
      <path
        className="route-path"
        d="M64 430 C 120 400, 96 340, 156 322 C 226 300, 208 250, 274 240 C 330 232, 344 200, 352 168"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* YOU ARE HERE — the idea */}
      <g>
        <circle className="you-dot" cx="64" cy="430" r="7" fill="var(--accent)" />
        <circle cx="64" cy="430" r="13" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity=".5" />
        <text x="86" y="428" fontFamily="var(--mono)" fontSize="11.5" letterSpacing="2.5" fill="var(--ink)" fontWeight="700">
          YOU ARE HERE
        </text>
        <text x="86" y="444" fontFamily="var(--mono)" fontSize="9.5" letterSpacing="2" fill="var(--ink-60)">
          THE IDEA
        </text>
      </g>

      {/* Waypoints lock in as the route reaches them */}
      <g className="route-wp wp-d1">
        <circle cx="156" cy="322" r="4.5" fill="var(--paper)" stroke="var(--accent)" strokeWidth="2" />
        <text x="140" y="345" fontFamily="var(--mono)" fontSize="9.5" letterSpacing="2" fill="var(--ink-60)">
          DATES LOCKED
        </text>
      </g>
      <g className="route-wp wp-d2">
        <circle cx="274" cy="240" r="4.5" fill="var(--paper)" stroke="var(--accent)" strokeWidth="2" />
        <text x="256" y="263" fontFamily="var(--mono)" fontSize="9.5" letterSpacing="2" fill="var(--ink-60)">
          STAY CHOSEN
        </text>
      </g>

      {/* X marks the booked trip */}
      <g className="dest-x">
        <g stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round">
          <line x1="343" y1="159" x2="361" y2="177" />
          <line x1="361" y1="159" x2="343" y2="177" />
        </g>
        <text
          x="352"
          y="145"
          fontFamily="var(--mono)"
          fontSize="11.5"
          letterSpacing="2.5"
          fill="var(--ink)"
          textAnchor="middle"
          fontWeight="700"
        >
          BOOKED
        </text>
      </g>
    </svg>
  )
}

/* ── Ticker — destinations with real coordinates ───────────────────────────── */

const TICKER_STOPS = [
  "KASOL 32.01° N",
  "GOKARNA 14.55° N",
  "SPITI 32.25° N",
  "MUNNAR 10.09° N",
  "JAISALMER 26.92° N",
  "TAWANG 27.59° N",
  "VARKALA 8.73° N",
  "COORG 12.42° N",
  "MEGHALAYA 25.47° N",
  "ANDAMANS 11.74° N",
  "CHOPTA 30.33° N",
  "HAMPI 15.34° N",
]

function TickerContent() {
  return (
    <span>
      {TICKER_STOPS.map((stop) => (
        <span key={stop} className="tick-item" data-label={`${stop} ◆`} />
      ))}
    </span>
  )
}

/* ── Field-kit plate figures — each mini chart carries real product data ───── */

function FigSurvey() {
  // Anonymous budget bands: 2 / 3 / 1 of six responses
  return (
    <svg width="96" height="80" viewBox="0 0 96 80" aria-hidden="true">
      <g fontFamily="var(--mono)" fontSize="7.5" fill="var(--ink-60)" letterSpacing="1">
        <text x="8" y="76">₹3–5K</text>
        <text x="40" y="76">₹5–8K</text>
        <text x="74" y="76">₹8K+</text>
      </g>
      <g>
        <rect x="10" y="40" width="16" height="26" fill="none" stroke="var(--ink)" strokeWidth="1.4" />
        <rect x="42" y="24" width="16" height="42" fill="var(--accent)" opacity=".85" />
        <rect x="74" y="52" width="16" height="14" fill="none" stroke="var(--ink)" strokeWidth="1.4" />
      </g>
      <g fontFamily="var(--mono)" fontSize="8.5" fill="var(--ink)" fontWeight="700" textAnchor="middle">
        <text x="18" y="35">2</text>
        <text x="50" y="19">3</text>
        <text x="82" y="47">1</text>
      </g>
    </svg>
  )
}

function FigSurfacer() {
  // Contours agree on the left, pull apart on the right — the silent conflict
  return (
    <svg width="100" height="76" viewBox="0 0 100 76" aria-hidden="true">
      <g fill="none" strokeWidth="1.3">
        <path d="M4 38 C 30 36, 55 20, 96 10" stroke="var(--ink)" opacity=".7" />
        <path d="M4 40 C 30 39, 55 32, 96 28" stroke="var(--ink)" opacity=".45" />
        <path d="M4 42 C 30 43, 55 50, 96 48" stroke="var(--ink)" opacity=".45" />
        <path d="M4 44 C 30 46, 55 62, 96 66" stroke="var(--accent)" strokeDasharray="4 3" />
      </g>
      <circle cx="8" cy="41" r="3" fill="var(--accent)" />
      <text x="60" y="42" fontFamily="var(--mono)" fontSize="7.5" fill="var(--accent)" letterSpacing="1.5" fontWeight="700">
        GAP
      </text>
    </svg>
  )
}

function FigVote() {
  // Ranked vote tally: 67 / 33
  return (
    <svg width="96" height="72" viewBox="0 0 96 72" aria-hidden="true">
      <g fontFamily="var(--mono)" fontSize="7.5" fill="var(--ink-60)" letterSpacing="1">
        <text x="6" y="18">KASOL</text>
        <text x="6" y="48">COORG</text>
      </g>
      <rect x="6" y="24" width="60" height="8" fill="var(--accent)" opacity=".85" />
      <rect x="6" y="54" width="30" height="8" fill="none" stroke="var(--ink)" strokeWidth="1.3" />
      <g fontFamily="var(--mono)" fontSize="8.5" fill="var(--ink)" fontWeight="700">
        <text x="72" y="31">67%</text>
        <text x="42" y="61">33%</text>
      </g>
    </svg>
  )
}

function FigDates() {
  // Availability matrix — the overlap window boxed in vermillion
  return (
    <svg width="96" height="76" viewBox="0 0 96 76" aria-hidden="true">
      <g fill="var(--ink)">
        {[0, 1, 2, 3, 4, 5, 6].map((c) =>
          [0, 1, 2, 3].map((r) => (
            <circle
              key={`${c}-${r}`}
              cx={12 + c * 12}
              cy={14 + r * 14}
              r="2.6"
              opacity={c >= 3 && c <= 5 ? 0.9 : 0.22}
            />
          ))
        )}
      </g>
      <rect x="42" y="4" width="36" height="60" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeDasharray="4 3" />
      <text x="12" y="74" fontFamily="var(--mono)" fontSize="7.5" fill="var(--ink-60)" letterSpacing="1.5">
        OVERLAP: 3 DAYS
      </text>
    </svg>
  )
}

function FigTasks() {
  // Manifest: two struck through, one live with an owner
  return (
    <svg width="96" height="72" viewBox="0 0 96 72" aria-hidden="true">
      <g fontFamily="var(--mono)" fontSize="8" letterSpacing="1">
        <g fill="var(--ink-40)">
          <text x="20" y="16" textDecoration="line-through">BOOK STAY</text>
          <text x="20" y="38" textDecoration="line-through">TRAIN TKTS</text>
        </g>
        <text x="20" y="60" fill="var(--ink)" fontWeight="700">FIRST AID — RIA</text>
      </g>
      <g stroke="var(--accent)" strokeWidth="1.8" fill="none">
        <path d="M6 12 l3 4 l6 -7" />
        <path d="M6 34 l3 4 l6 -7" />
        <rect x="6" y="52" width="9" height="9" stroke="var(--ink)" />
      </g>
    </svg>
  )
}

function FigLedger() {
  // Settlement: sums resolve to zero
  return (
    <svg width="96" height="76" viewBox="0 0 96 76" aria-hidden="true">
      <g fontFamily="var(--mono)" fontSize="8" letterSpacing="1" fill="var(--ink-60)">
        <text x="8" y="14">ARJUN</text>
        <text x="8" y="32">MEERA</text>
        <text x="8" y="50">DEV</text>
      </g>
      <g fontFamily="var(--mono)" fontSize="8" letterSpacing="1" textAnchor="end">
        <text x="88" y="14" fill="var(--ink)">+4,200</text>
        <text x="88" y="32" fill="var(--ink)">−2,600</text>
        <text x="88" y="50" fill="var(--ink)">−1,600</text>
      </g>
      <line x1="8" y1="58" x2="88" y2="58" stroke="var(--ink)" strokeWidth="1.4" />
      <text x="88" y="72" fontFamily="var(--mono)" fontSize="8.5" fill="var(--accent)" fontWeight="700" letterSpacing="1.5" textAnchor="end">
        SETTLED · 0
      </text>
    </svg>
  )
}

const KIT_PLATES = [
  {
    no: "Plate I",
    tick: "◆",
    fig: <FigSurvey />,
    title: "The quiet ballot",
    tag: "Anonymous survey",
    body: "Budget, dates, diets, trip style — collected privately. The honest numbers surface because no one is watching anyone answer.",
    footLabel: "Reads as",
    foot: "Budget bands · 6 responses",
  },
  {
    no: "Plate II",
    tick: "◆",
    fig: <FigSurfacer />,
    title: "The surfacer",
    tag: "AI synthesis — Claude",
    body: "Claude reads every private answer and maps where the group's terrain pulls apart — before the expensive mistake gets booked.",
    footLabel: "Flags",
    foot: "Budget gap · style split",
  },
  {
    no: "Plate III",
    tick: "◆",
    fig: <FigVote />,
    title: "The show of hands",
    tag: "Group voting",
    body: "Destination, dates, stay — put to an anonymous vote with options the AI drafted from real preferences. Decisions that stick.",
    footLabel: "Decides",
    foot: "Destination · dates · stay",
  },
  {
    no: "Plate IV",
    tick: "◆",
    fig: <FigDates />,
    title: "The muster roll",
    tag: "RSVP + availability",
    body: "Who's in, who's a maybe, and the exact window when the most of the party can actually travel — found, not argued.",
    footLabel: "Finds",
    foot: "The overlap window",
  },
  {
    no: "Plate V",
    tick: "◆",
    fig: <FigTasks />,
    title: "The manifest",
    tag: "Task board",
    body: "Bookings, tickets, permits — assigned to named owners with deadlines and push reminders. The organizer stops carrying it alone.",
    footLabel: "Tracks",
    foot: "Owners · deadlines · nudges",
  },
  {
    no: "Plate VI",
    tick: "◆",
    fig: <FigLedger />,
    title: "The settlement",
    tag: "Expense ledger",
    body: "Shared costs logged as they happen, split fairly, and resolved to the minimum set of transfers. The ledger closes at zero.",
    footLabel: "Closes at",
    foot: "Settled · no IOUs",
  },
]

/* ── The Surfacer diagram — terrain pulling apart between two waypoints ────── */

function SurfacerDiagram() {
  return (
    <svg viewBox="0 0 560 320" role="img" aria-label="Diagram: contour lines run together where the group agrees, then fan apart across a hatched gap between a 3,000-rupee-a-day preference and a 9,000-rupee-a-day preference">
      {/* Agreement — lines travel together */}
      <g fill="none" strokeWidth="1.5">
        <path d="M30 156 C 110 150, 170 118, 250 96 C 340 72, 420 52, 530 34" stroke="var(--ink)" opacity=".65" />
        <path d="M30 160 C 110 156, 170 140, 250 132 C 340 122, 420 108, 530 96" stroke="var(--ink)" opacity=".4" />
        <path d="M30 164 C 110 164, 170 164, 250 168 C 340 172, 420 178, 530 182" stroke="var(--ink)" opacity=".4" />
        <path d="M30 168 C 110 172, 170 190, 250 204 C 340 220, 420 238, 530 252" stroke="var(--ink)" opacity=".65" />
        <path
          className="route-path"
          d="M30 172 C 110 180, 170 214, 250 240 C 340 268, 420 284, 530 296"
          stroke="var(--accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {/* Hatched divergence zone */}
      <g stroke="var(--accent)" strokeWidth="1" opacity=".35">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={i} x1={344 + i * 22} y1={120} x2={324 + i * 22} y2={216} />
        ))}
      </g>

      {/* Waypoints */}
      <g>
        <circle className="you-dot" cx="30" cy="164" r="6" fill="var(--accent)" />
        <text x="22" y="192" fontFamily="var(--mono)" fontSize="10" letterSpacing="2" fill="var(--ink)" fontWeight="700">
          WHERE YOU AGREE
        </text>
        <text x="22" y="206" fontFamily="var(--mono)" fontSize="8.5" letterSpacing="1.5" fill="var(--ink-60)">
          MOUNTAINS · 5 DAYS · MARCH
        </text>
      </g>
      <g>
        <text x="530" y="22" fontFamily="var(--mono)" fontSize="10" letterSpacing="2" fill="var(--ink)" fontWeight="700" textAnchor="end">
          ₹9K / DAY
        </text>
        <text x="530" y="316" fontFamily="var(--mono)" fontSize="10" letterSpacing="2" fill="var(--ink)" fontWeight="700" textAnchor="end">
          ₹3K / DAY
        </text>
        <text x="452" y="172" fontFamily="var(--mono)" fontSize="10.5" letterSpacing="2.5" fill="var(--accent)" fontWeight="700" textAnchor="middle">
          THE SILENT GAP
        </text>
      </g>
    </svg>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

const START_HREF = "/auth/signin?callbackUrl=/trips/new"
const SIGNIN_HREF = "/auth/signin?callbackUrl=/dashboard"

export default function LandingPage() {
  const reveal = useScrollReveal()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const heroRv = (extra?: string) => `rv${loaded ? " in" : ""}${extra ? ` ${extra}` : ""}`

  return (
    <div data-loaded={loaded} style={{ width: "100%", overflowX: "hidden" }}>
      {/* ── Header ── */}
      <header className="cart-header">
        <div className="hd-inner">
          <Link className="wordmark" href="/" aria-label="Trivo home">
            <TrivoMark />
            Trivo
          </Link>
          <span className="cart-badge">Field guide to group travel</span>
          <nav className="hd-nav" aria-label="Sections">
            <a className="lnk" href="#ledger">
              <span className="idx">01</span>Ledger
            </a>
            <a className="lnk" href="#kit">
              <span className="idx">02</span>Field kit
            </a>
            <a className="lnk" href="#surfacer">
              <span className="idx">03</span>Surfacer
            </a>
            <a className="lnk" href="#route">
              <span className="idx">04</span>Route
            </a>
            <Link className="lnk" href={SIGNIN_HREF}>
              Sign in
            </Link>
            <Link className="hd-cta" href={START_HREF}>
              Begin a trip
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero" id="top">
        <Contours />
        <div className="coords" aria-hidden="true">
          26.9124° N &nbsp;·&nbsp; 75.7873° E &nbsp;·&nbsp; TRIP № 01 &nbsp;·&nbsp; PARTY OF 6 &nbsp;·&nbsp; SHEET 1 OF 1
        </div>
        <div className="cart-wrap">
          <div className="hero-grid">
            <div>
              <div className={heroRv()}>
                <span className="fig-tag">
                  <b>FIG. 1</b> THE EXPEDITION, BEFORE THE GROUP CHAT
                </span>
              </div>
              <h1 className={heroRv("d1")}>
                Every great trip dies in the <span className="em">group chat.</span>{" "}
                <span className="quiet">Yours won&apos;t.</span>
              </h1>
              <p className={`cart-sub ${heroRv("d2")}`}>
                Trivo maps the whole expedition — <strong>anonymous budgets, one shared plan, and AI
                that surfaces the conflicts nobody says out loud</strong> — so eight maybes become one
                booked trip.
              </p>
              <div className={`cta-row ${heroRv("d3")}`}>
                <Link className="cta" href={START_HREF}>
                  Chart the trip — free <span className="arrow" aria-hidden="true">→</span>
                </Link>
                <div className="cta-note">
                  <strong>Free</strong> · no credit card
                  <br />
                  WhatsApp invite · any phone
                </div>
              </div>
            </div>
            <figure className={`hero-fig ${heroRv("d3")}`}>
              <HeroCompassRoute />
            </figure>
          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          <TickerContent />
          <TickerContent />
        </div>
      </div>

      {/* ── № 01 · The ledger ── */}
      <section id="ledger">
        <div className="cart-wrap">
          <div ref={reveal} className="sec-head rv">
            <span className="sec-no">№ 01</span>
            <h2 className="sec-title">
              A plan, <i>not a scroll-back.</i>
            </h2>
            <span className="sec-rule" />
          </div>

          <div ref={reveal} className="ledger rv d1">
            <span className="stamp" aria-hidden="true">
              Surveyed · No guesswork
            </span>
            <div className="ledger-col no">
              <h3>Struck from the record</h3>
              <ul>
                <li>
                  <span className="mk">✕</span>
                  <span className="strike">&quot;So are we doing this or not?&quot; — asked for the 47th time</span>
                </li>
                <li>
                  <span className="mk">✕</span>
                  <span className="strike">The ₹18k villa three people can&apos;t afford but won&apos;t say so</span>
                </li>
                <li>
                  <span className="mk">✕</span>
                  <span className="strike">Poll #4, closed at midnight, results lost to the scroll</span>
                </li>
                <li>
                  <span className="mk">✕</span>
                  <span className="strike">One organizer making 47 decisions alone</span>
                </li>
                <li>
                  <span className="mk">✕</span>
                  <span className="strike">&quot;I&apos;ll pay you back after the trip&quot; — he won&apos;t</span>
                </li>
              </ul>
            </div>
            <div className="ledger-col yes">
              <h3>Entered into the plan</h3>
              <ul>
                <li>
                  <span className="mk">◆</span>
                  <span>
                    <b>Anonymous budget bands</b> — the honest numbers, collected without an audience
                  </span>
                </li>
                <li>
                  <span className="mk">◆</span>
                  <span>
                    <b>One survey</b> — dates, diets, and trip styles from every member of the party
                  </span>
                </li>
                <li>
                  <span className="mk">◆</span>
                  <span>
                    <b>AI synthesis</b> — three concrete options the whole group can actually live with
                  </span>
                </li>
                <li>
                  <span className="mk">◆</span>
                  <span>
                    <b>Votes on the record</b> — decisions that stick instead of reopening nightly
                  </span>
                </li>
                <li>
                  <span className="mk">◆</span>
                  <span>
                    <b>A settled ledger</b> — every rupee accounted for, no IOUs on the flight home
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── № 02 · The field kit ── */}
      <section id="kit" className="plates-band">
        <div className="cart-wrap">
          <div ref={reveal} className="sec-head rv">
            <span className="sec-no">№ 02</span>
            <h2 className="sec-title">
              The field kit — <i>six instruments.</i>
            </h2>
            <span className="sec-rule" />
          </div>

          <div ref={reveal} className="plates even-3 rv d1">
            {KIT_PLATES.map((plate) => (
              <article key={plate.no} className="plate">
                <div className="plate-no">
                  <span>{plate.no}</span>
                  <span className="tick">{plate.tick}</span>
                </div>
                <div className="plate-fig">{plate.fig}</div>
                <h4>
                  <span>{plate.title}</span>
                  <span className="plate-tag">{plate.tag}</span>
                </h4>
                <p>{plate.body}</p>
                <div className="plate-foot">
                  <b>{plate.footLabel}</b>
                  <span>{plate.foot}</span>
                </div>
              </article>
            ))}
          </div>

          <div ref={reveal} className="plates-cap rv">
            <span>
              <b>◆</b>&nbsp; Every figure above is drawn from real trip data — nothing is illustration
            </span>
            <span>Six instruments · one shared sheet</span>
          </div>
        </div>
      </section>

      {/* ── № 03 · The Silent Conflict Surfacer ── */}
      <section id="surfacer" style={{ position: "relative" }}>
        <div className="coords" aria-hidden="true">
          FIG. 2 &nbsp;·&nbsp; PREFERENCE TERRAIN &nbsp;·&nbsp; 6 RESPONSES &nbsp;·&nbsp; 1 GAP FLAGGED
        </div>
        <div className="cart-wrap">
          <div ref={reveal} className="sec-head rv">
            <span className="sec-no">№ 03</span>
            <h2 className="sec-title">
              The silent conflicts, <i>surfaced.</i>
            </h2>
            <span className="sec-rule" />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "clamp(28px, 4vw, 56px)",
              alignItems: "center",
              marginBottom: "clamp(56px, 8vw, 96px)",
            }}
          >
            <div ref={reveal} className="rv">
              <span className="fig-tag" style={{ marginBottom: 22 }}>
                <b>FIG. 2</b> PREFERENCE TERRAIN, ONE TRIP
              </span>
              <p className="cart-sub" style={{ marginBottom: 18 }}>
                Nobody says <strong>&quot;₹5k a day feels like a lot to me.&quot;</strong> They just go
                quiet, and three weeks later they drop out. That silence is where group trips die.
              </p>
              <p className="cart-sub" style={{ marginBottom: 28 }}>
                Trivo&apos;s surfacer reads every anonymous answer and draws the group as terrain: where
                you agree, the contours run together — where budgets and styles diverge,{" "}
                <strong>the lines pull apart and the gap gets flagged</strong> before anything expensive
                gets booked. Powered by Claude.
              </p>
              <Link className="cta sm" href={START_HREF}>
                See your group&apos;s terrain <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </div>
            <div ref={reveal} className="rv d2">
              <div
                style={{
                  border: "2px solid var(--ink)",
                  background: "var(--paper)",
                  padding: "clamp(16px, 2.5vw, 28px)",
                  boxShadow: "6px 6px 0 var(--ink-15), 0 24px 48px -16px rgba(29,37,49,.35)",
                }}
              >
                <SurfacerDiagram />
                <div
                  className="m-label"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    borderTop: "1px dashed var(--ink-15)",
                    paddingTop: 12,
                    marginTop: 12,
                  }}
                >
                  <span>
                    <b>FIG. 2</b> — WHERE THE PARTY DIVERGES
                  </span>
                  <span>DRAWN FROM 6 ANONYMOUS ANSWERS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── № 04 · The route ── */}
      <section id="route" style={{ borderTop: "1px solid var(--ink-15)" }}>
        <div className="cart-wrap">
          <div ref={reveal} className="sec-head rv">
            <span className="sec-no">№ 04</span>
            <h2 className="sec-title">
              The route, <i>in three bearings.</i>
            </h2>
            <span className="sec-rule" />
          </div>
          <div className="legend">
            <div ref={reveal} className="leg rv">
              <span className="leg-no">i.</span>
              <h4>Raise the party</h4>
              <p>
                Name the trip, share <strong>one WhatsApp link.</strong> Everyone joins in a tap — no
                app store, no account gymnastics, works on every phone in the group.
              </p>
            </div>
            <div ref={reveal} className="leg rv d1">
              <span className="leg-no">ii.</span>
              <h4>Take bearings</h4>
              <p>
                Each member answers <strong>one private survey.</strong> Claude synthesizes the answers,
                the surfacer flags the gaps, and the group votes on options built from the evidence.
              </p>
            </div>
            <div ref={reveal} className="leg rv d2">
              <span className="leg-no">iii.</span>
              <h4>Walk the route</h4>
              <p>
                Tasks get named owners, the itinerary fills day by day, expenses log as they happen —
                and the ledger <strong>settles to zero</strong> before you&apos;re home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Close ── */}
      <section className="close-sec" id="start">
        <div className="cart-wrap">
          <div ref={reveal} className="rv">
            <span
              className="close-sub"
              style={{ display: "block" }}
            >
              FIG. 3 — THE WHOLE PARTY, ONE SHEET
            </span>
          </div>
          <h2 ref={reveal} className="close-h rv d1">
            One map.
            <br />
            <i>The whole party on it.</i>
          </h2>
          <p ref={reveal} className="close-sub rv d2">
            Free · Anonymous surveys · Settles to zero
          </p>
          <div ref={reveal} className="rv d3">
            <Link className="cta light" href={START_HREF}>
              Begin the expedition — free <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="cart-footer">
        <div className="cart-wrap ft">
          <span>
            <strong>Trivo</strong> — surveyed by the whole party
          </span>
          <span>
            Sheet 1 of 1 · 2026 · <span className="v">◆</span> 26.9124° N 75.7873° E
          </span>
        </div>
      </footer>
    </div>
  )
}

# Trivo — Group Travel Planning Platform

> An AI-powered coordination layer that distributes planning load, surfaces conflicts early, and keeps the whole group aligned — without a group chat.

**Stage:** PRD · Prototype &nbsp;|&nbsp; **Stack:** PWA · React · AI

---

## The Problem

In group travel, 1–2 people absorb 80%+ of the planning load. Budget misalignments and preference conflicts don't surface until mid-trip — after flights are booked and money is spent. The $168.7B group travel market has no tool designed for distributed coordination; it has tools designed for one person to plan on behalf of everyone else.

## What I Built

A Progressive Web App where every group member participates in planning. AI surfaces preference conflicts before commitments are made, distributes tasks across the group, and keeps everyone aligned through a shared decision layer — not a shared group chat.

Key design decisions:
- **Conflict-first UX** — the app surfaces disagreements proactively (budget range, activity preferences, travel dates) before any booking is initiated
- **Distributed task ownership** — planning tasks assigned by AI based on who expressed interest or expertise, not defaulting to one coordinator
- **PWA** — installable, works offline for itinerary viewing, no app store friction
- **Built on real research** — 6 user interviews mapped the exact breakdown points in group planning before a single line of code was written

## Research

| Method | Output |
|--------|--------|
| 6 user interviews | Pain point mapping across planning phases |
| Market sizing | $168.7B TAM, group segment analysis |
| Full PRD | Problem → solution → user stories → system design |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React (PWA) |
| AI | Claude API |
| Hosting | Vercel |

## Links

- **Live prototype:** https://frontend-argaurs-projects.vercel.app
- **Case study:** https://gauravg-portfolio.vercel.app/case-study-group-travel.html
- **Portfolio:** https://gauravg-portfolio.vercel.app

---

> Built by [Gaurav Gupta](https://linkedin.com/in/ar-gaurav) — Senior PM & AI Strategist

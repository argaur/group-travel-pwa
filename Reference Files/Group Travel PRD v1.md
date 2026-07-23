# Tab 1

**GROUP TRAVEL PLANNING PLATFORM**

Product Requirements Document

Rethink AI MPM Cohort 7  |  Week 7  |  March 2026

Research: Primary (11 interviews) \+ Secondary (industry, competitive, academic)

────────────────────────────────────────────────────────────────────────────────

**→  EXECUTIVE SUMMARY**

Group travel planning is a $168.7 billion global market growing at 7.2% CAGR — faster than solo travel — yet the coordination layer that helps groups decide, plan, and execute trips together remains almost entirely unsolved. Today, groups stitch together 4–5 disconnected tools (WhatsApp, Google Sheets, Splitwise, Airbnb, Google Maps) and one person absorbs the entire coordination burden. The result: the organizer has the worst trip experience, silent misalignments around budget and diet surface mid-trip as conflict, and 2–3 weeks of planning inactivity kill group energy before departure.

This PRD defines a group-travel-first coordination platform — an AI-native product that handles the full journey from 'let's go somewhere' to post-trip expense settlement. The core insight from 11 user interviews and deep secondary research is this: group travel planning is fundamentally a social and emotional challenge, not a logistical one. The hardest part isn't finding hotels — it's getting six people to agree on anything without social awkwardness.

**Key Finding:** *The $168B+ global group travel market is growing faster than solo travel, yet the coordination layer remains almost entirely unsolved. No product today owns the full journey. This is a large, underserved whitespace.*

────────────────────────────────────────────────────────────────────────────────

**01  PROBLEM FOUNDATION & MARKET CONTEXT**

────────────────────────────────────────────────────────────────────────────────

## **1.1  Global & India Market Sizing**

| Metric | Value | Source |
| :---- | :---- | :---- |
| Global Travel Gross Bookings (2024) | $1.6 Trillion | Phocuswright, 2025 |
| Global Group Travel Market (2024) | $168.7 Billion | Growth Market Reports |
| Group Travel CAGR (2025–2033) | 7.2% (outpacing solo travel) | Growth Market Reports |
| Projected Group Travel Market (2033) | $314.7 Billion | APAC leading at 8.4% CAGR |
| India Travel & Tourism Market (2024) | $22.5 Billion | IMARC Group |
| India Online Travel Market (2024) | $51 Billion | IMARC Group |
| Domestic Tourist Visits in India (2023) | 2.5 Billion (+45% YoY) | Ministry of Tourism |
| Non-Metro Share of Outbound Travel | 63% | TravClan India Outbound Index 2025 |
| India Travel Tech Funding Jump (2024) | $600M (+182.2% YoY) | Inc42, 2024 |
| Travel Planning Apps Market (2024) | $8.1B → $13.2B by 2029 | Industry forecast |

## **1.2  Why Now — The Strategic Window**

Several converging signals make 2025–2026 a structural inflection point for the group travel coordination category:

* **AI disruption window:** Travel tech VC hitting AI-focused tools at 45% of all travel investment (mid-2025). AI-native products can now absorb group preferences privately and synthesize shared options — directly addressing the social friction problem.  
* **Incumbent gap:** MakeMyTrip recently acquired Flamingo Transworld (group holiday packages), signalling they recognise the coordination gap — but are trying to fill it through M\&A, not product innovation. A 12–24 month window exists before incumbents move decisively.  
* **India mobile infrastructure:** 660M+ smartphone users, mobile data at ₹9/GB (from ₹269/GB in 2014), UPI-native payments, 79% of Indian travellers download apps pre-travel. Zero onboarding friction.  
* **Tier 2/3 explosion:** Non-metro cities now drive 63% of outbound travel and 11.84% growth in domestic search. WhatsApp penetration at 550M+ in India means any group coordination product can leverage existing habits.

## **1.3  The Typical Group Trip Failure Journey**

This nine-step pattern was independently validated across multiple interviews and is confirmed by industry research:

| Stage | What Happens |
| :---- | :---- |
| Step 1 | Someone says 'let's go\!' on WhatsApp |
| Step 2 | 12 destinations suggested across 3 different conversations |
| Step 3 | WhatsApp poll created — 3 of 7 vote, poll expires unresolved |
| Step 4 | Dates debated across days; someone can't make shortlisted dates, group splinters |
| Step 5 | Budget never discussed; one person assumes ₹5,000/day, another assumes ₹15,000/day |
| Step 6 | One frustrated person builds a Google Sheet alone and shares it |
| Step 7 | Booking done in a rushed final sprint — double-bookings, sold-out options, price spikes |
| Step 8 | During trip: nobody knows the day's plan; organizer becomes GPS \+ concierge \+ accountant |
| Step 9 | Post-trip: Splitwise is messy, some expenses undocumented, unpaid debts linger |

────────────────────────────────────────────────────────────────────────────────

**02  RESEARCH & VALIDATION**

────────────────────────────────────────────────────────────────────────────────

## **2.1  Primary Research — Methodology**

| Parameter | Details |
| :---- | :---- |
| Method | Semi-structured user interviews (video call, transcribed via Otter.ai) |
| Total Interviews | 6 core interviews (cross-validated across two research phases) |
| Researcher | Gaurav Gupta, PM/Researcher |
| Interview Period | March 28–30, 2026 |
| Geographic Coverage | 1 US-based (Seattle), 5 India-based (Bangalore, Rajasthan, Kerala) |
| Group Types | Multi-family (2), Office colleagues (2), Friend groups (2) |
| Trip Types | Domestic leisure, international, mountain treks, beach, family vacation |
| Kids Involvement | 3 of 6 interviews included families with young children |
| Cross-Validation | 2 interviews (Gaurav Gupta & Rohit) independently describe the same Bir Billing trip |
| Known Blind Spots | Sample skews tech/PM professionals; limited representation of non-Tier 1 cities; no retired/elderly travellers |

## **2.2  Traveler Archetypes**

Four distinct archetypes emerged from interview analysis. Most users exhibit more than one archetype depending on group composition and trip type.

| Archetype | Who They Are | Behaviour | Core Pain |
| :---- | :---- | :---- | :---- |
| The Delegator Approver | Takes no active lead; participates in validation. Comfortable letting others plan. (Gajalakshmi, Aashik) | Waits for 2–3 options to be shortlisted, then picks one. Uses WhatsApp passively. | Voices dissatisfaction after the fact if not consulted before final booking. |
| The Reluctant Organizer | Becomes de-facto planner by default — due to local knowledge, seniority, or history. (Gaurav Gupta in Bir Billing, Aashik's coordinator) | Books Airbnb, manages petrol, drives the car. Bears disproportionate cognitive load. | 'I was the only driver and had to drive 13 hours after a full day of office.' |
| The Budget Whisperer | Acutely aware of group financial dynamics. Silently calibrates preferences to implied budget. (Multiple users across all interviews) | Uses Airbnb price selection as an indirect budget signal. Avoids stating constraints openly. | No socially safe mechanism to communicate budget limits without embarrassment. |
| The Experience-First Traveller with Constraints | Wants a rich trip but is constrained by family needs — young kids, dietary restrictions, physical limitations. (Sabya, Gajalakshmi, Rahul) | Prefers Airbnb for kitchen access; skips stroller-unfriendly locations; filters heavily. | 'With the child, you cannot be outside all throughout the day.' — Gajalakshmi |

## **2.3  Cross-Cutting Themes (4+ of 6 interviews)**

**T1  WhatsApp \+ Spreadsheet Cobbling — No Unified Planning Surface**

All 6 interviewees used WhatsApp as primary coordination. Google Sheets used ad hoc for budgets. Critical decisions (stay, budget, itinerary) are scattered across chat threads. No single source of truth for group decisions. Information scattered across: WhatsApp, Google Docs, booking confirmations, Instagram, Notes app, Splitwise.

**T2  Budget is the First Conversation but the Hardest to Have Openly**

Budget discussion is universally acknowledged as the starting point — yet groups consistently avoid stating actual constraints. Indirect signals used: suggesting cheaper Airbnb, choosing off-season, proposing shorter durations. Mismatch surfaces during the trip as resentment. 'People say I'm okay with it, but when the trip comes, they say this is way too costly for me.' — Gaurav Gupta

**T3  Dietary & Preference Misalignment Discovered Too Late**

6/6 interviews referenced dietary restrictions as a coordination failure. Ranges from veg/non-veg to Jain food, onion/garlic-free, and kid-friendly needs. Users assume flexibility and discover conflict on the ground. One participant wouldn't enter a restaurant that served non-vegetarian food — never communicated upfront. No current tool prompts or collects this information.

**T4  Planning Load is Asymmetric — 1–2 People Do All the Work**

In every trip described, 1–2 people did the majority of research, booking, and coordination. Others are 'along for the ride' during planning, then vocal during execution. This creates organizer resentment and passive member disillusionment when outcomes don't match expectations. 'I want all the organiser's responsibility to go away.' — Aashik

**T5  Sub-Group Divergence During Trips — Organic and Expected**

4/6 interviewees described instances where the group naturally split during the trip. Divergence happens around personal interests, kid needs, restaurant choice, or personal visits. This is viewed positively — but is entirely unplanned and managed ad hoc via WhatsApp. Opportunity: structured flexibility with planned divergence and easy re-aggregation.

**T6  Splitwise as a Standard, but Effortful**

Splitwise mentioned by 3/6 as the go-to expense tracker. Pain: manual entry of every expense is tedious; people forget or stop logging. Best-working workaround: split fixed costs upfront (hotel, petrol) so Splitwise only handles variable expenses. Some groups used an 'escrow model' — one person pays for one category throughout. 'Multiple sub cuts, and then it was a mess.' — Rahul

## **2.4  Pain Points Ranked by Severity**

| Pain Point | User Evidence | Severity |
| :---- | :---- | :---- |
| Silent budget misalignment | 'People say I'm okay with it, but when the trip comes, they say this is way too costly for me.' — Gaurav Gupta | 🔴 Critical |
| No upfront preference collection (dietary, mobility) | 'We never talked about the dietary part. That was one of the problem areas.' — Gaurav Gupta | 🔴 Critical |
| Asymmetric planning burden | 'I want all the organiser's responsibility to go away.' — Aashik | 🔴 Critical |
| No real-time road / ground truth data | 'Google Maps shows blue roads in mountains, but landslides and bad roads are not updated in real time.' — Gaurav Gupta | 🟠 High |
| Hotel quality mismatch vs. reviews | 'We booked the best-reviewed place in Udupi. When we got there, the service was pathetic.' — Rahul | 🟠 High |
| Expense tracking fatigue | 'Splitwise requires manual entry every time. Eventually we abandoned it for a category-ownership model.' — Rahul | 🟠 High |
| Last-minute cancellations disrupting plans | 'One person cancelled at the last moment. We had to switch from 3 cars to one traveller.' — Aashik | 🟠 High |
| No structured itinerary for sub-groups | 'People go different ways, we manage it ad hoc on WhatsApp. There's no planning for that.' — Multiple users | 🟡 Medium |
| Children-specific logistics (stroller, kitchen, medical) | 'Do we need a stroller? Is this place bumpy? We google each thing separately.' — Gajalakshmi | 🟡 Medium |
| Platform accountability gap | 'MakeMyTrip called, but they can only suggest alternatives — not really fix my experience.' — Rahul | 🟡 Medium |

## **2.5  Key Verbatim Quotes**

**On Budget Avoidance:**

*"No one was kind of upfront... through the selection of places, people were exposing their budgetary preferences in a way."*  
**— Sabya, Senior PM, Seattle**

*"They will probably say, Hi, I'm okay with it. And when you're actually on the trip, they will say, Yeah, this is getting too costly for me."*  
**— Gaurav Gupta, Tech/PM, Bangalore**

*"Whatever the budget we keep, it mostly 99% goes beyond what we kept."*  
**— Gajalakshmi, Multi-family International Trip**

**On Organizer Burden:**

*"I want all the organiser's responsibility to go away."*  
**— Aashik Villa, Kerala Group Trip**

**On Dietary Friction:**

*"Certain people have really strong restrictions — there have been situations where one person is vegetarian and that person won't even go to a restaurant which prepares non-veg food."*  
**— Gaurav Gupta, Bir Billing Trip**

**On Expense Splitting:**

*"Multiple sub cuts, and then it was a mess — Splitwise me or challenge, because you have to enter it manually every time."*  
**— Rahul Kumar, Kerala Trip**

**On Being Trapped by a Bad Booking:**

*"Since we had paid for like three days in advance, so now you are stuck. You have paid a hefty price, and you are stuck."*  
**— Rahul Kumar, Kerala Trip**

**On What Would Actually Help:**

*"People tend to avoid talking about their budget or dietary restrictions upfront. They say they are okay with everything — but when they actually reach there, they start complaining. If there was some way to make those people comfortable in saying those things early on... it would have been really nice."*  
**— Gaurav Gupta, Researcher & Product Manager**

## **2.6  Secondary Research — Competitive Landscape**

No single product handles the full group travel coordination lifecycle. Users are forced to stitch together 4–5 tools:

| Tool | Core Strength | Group Features | Key Gap | Pricing |
| :---- | :---- | :---- | :---- | :---- |
| WhatsApp / Telegram | Real-time comms, link sharing | Group chats, polls, media | Polls expire, messages buried, no structure or source of truth | Free |
| Wanderlog | Visual itinerary \+ map planning | Collaborative editing, shared itineraries | Weak group voting, no budget split, 5–8% free-to-paid conversion | Free / $40–60/yr Pro |
| TripIt | Email-to-itinerary import, flight alerts | View-only sharing | Single-user focused; no group budgeting | Free / $49.99/yr Pro |
| Splitwise | Expense splitting \+ settlement | Group expense ledger, IOUs | No planning features; manual entry fatigue; post-trip only | Free / $3.99/mo Pro |
| Google Travel | Inspiration, saved places | Saved lists (shareable) | Zero group coordination whatsoever | Free |
| MakeMyTrip / Booking.com | Search and book flights, hotels, packages | None | Individual booking only; no group decision layer | Commission-based |
| Plan Harmony | Group-first itinerary builder, real-time collab | Day-by-day group plans, share/export | New entrant; no India-specific features | Freemium |
| Google Sheets | Budget tracking, shared lists | Shareable, multi-user editing | Not mobile-first; intimidating for non-planners; no travel features | Free |

## **2.7  Competitive Gap Matrix — What No Tool Solves**

| Feature / Planning Phase | Best Current Tool (Partial) | Gap Severity |
| :---- | :---- | :---- |
| Anonymous budget preference collection | None | 🔴 Critical — No tool does this |
| Upfront dietary / constraint onboarding | None | 🔴 Critical — No tool does this |
| Group destination voting with context | WhatsApp polls (expire) | 🔴 Critical — Polls expire, no context |
| Calendar availability across group members | When2Meet (external) | 🟠 High — Separate tool, no travel context |
| Collaborative itinerary with sub-groups | Wanderlog (basic) | 🟠 High — No divergence planning |
| Real-time expense tracking \+ auto-split | Splitwise (manual) | 🟠 High — Manual entry fatigue |
| Organiser task distribution | None | 🟠 High — No tool distributes load |
| Single group dashboard / source of truth | None | 🟠 High — Fragmented across 4 apps |
| Passive-member nudging / engagement | None | 🟠 High — WhatsApp notifications only |
| Kids / constraint-aware filters | None | 🟡 Medium — Partial via Google search |
| Mountain / off-grid real-time advisories | Google Maps (partial) | 🟡 Medium — No crowd-sourced alerts |
| Group momentum tracking | None | 🟡 Medium — No product tracks this |

## **2.8  AI Disruption in Group Travel**

The AI opportunity isn't just automation — it's reducing the coordination tax of group decisions:

| Metric | Value | Source |
| :---- | :---- | :---- |
| Global consumers using AI for travel planning | 40% | Statista, 2025 |
| Travellers who say AI improves trip planning | 78% | Industry survey, 2025 |
| Travellers who have actively used AI for planning | 38% | TakeUp AI, 2026 |
| Would book a hotel based on AI recommendation alone | 84% | TakeUp AI, 2026 |
| Consumers comfortable letting AI plan their travel | \~25% | PYMNTS Intelligence, 2025 |
| Travellers with concerns about AI output trust | 91% | Booking.com Consumer Survey, 2025 |
| Share of travel-tech VC going to AI (mid-2025) | 45% | Up from 10% in 2023 |

────────────────────────────────────────────────────────────────────────────────

**03  PROBLEM STATEMENT**

────────────────────────────────────────────────────────────────────────────────

## **3.1  The Core Insight**

*"Group travel coordination is a fundamentally social and emotional challenge — not merely a logistical one. Users avoid direct conversations about money and preferences, leading to silent misalignments that surface during the trip itself and degrade the collective experience."*  
**— PS2 Primary Research Executive Summary**

## **3.2  The Three Root Problems**

**Root Problem 1: Silent Budget Misalignment**

Budget is the \#1 source of group trip friction and the least openly discussed topic. No tool creates a 'socially safe' mechanism for budget disclosure. Groups proxy budget preferences through accommodation price selection rather than direct conversation. The mismatch surfaces mid-trip as resentment, not pre-trip as planning input. This is not a problem of dishonesty — it is a structural design gap. The product must make it safe and frictionless to share constraints anonymously.

**Root Problem 2: The Organizer Tax**

1–2 people absorb 80%+ of all coordination load — research, booking, reminders, expense tracking, and live itinerary management. This creates a single point of failure before and during the trip. The irony: the organizer consistently has the worst trip experience. This is a group-size phenomenon, not an individual failing. No current product is designed to distribute planning load across group members. The product must make task distribution the default, not the exception.

**Root Problem 3: No Single Source of Truth**

Information is scattered across WhatsApp threads, Google Docs, booking confirmation emails, Instagram saves, Notes apps, and Splitwise. No single page shows: where are we going, when, what's the plan each day, what's the cost, what activities are confirmed. This amplifies the organizer tax, creates confusion during the trip, and makes passive members even more disengaged. Every interaction adds friction; no interaction builds shared context.

## **3.3  Why Existing Solutions Fail — Three Architectural Ceilings**

| Tool | What It Tries to Solve | Architectural Ceiling | Why It Can't Fix This |
| :---- | :---- | :---- | :---- |
| WhatsApp | Group communication and coordination | No structure, no persistence, no decision framework | Conversations are ephemeral. Decisions get buried. Passive members never get a signal that something needs their input. |
| Splitwise | Post-trip expense settlement | Post-hoc only; manual entry required for every expense | Designed for after the spending happens. Cannot prevent budget misalignment during planning. Manual friction causes abandonment. |
| Wanderlog | Itinerary building and map planning | Individual-first design with group features bolted on | Weak group voting, no budget splitting, no preference collection. Non-planners find it overwhelming. 5–8% convert to paid. |
| Google Sheets | Shared budget tracking and lists | Not mobile-first; requires effort to set up; no travel context | Non-planners find a blank spreadsheet intimidating. No travel-specific features. Can't nudge, can't collect preferences. |

## **3.4  Out of Scope (V1)**

Explicit cuts to prevent scope creep:

* Actual booking / OTA functionality (V1 is the coordination layer; not a booking engine)  
* Flight or hotel price aggregation (link out to MakeMyTrip / Airbnb)  
* Corporate / MICE travel (different compliance and procurement needs)  
* Solo travel features  
* Mountain / off-grid real-time road advisories (P1 — requires data partnerships)  
* Ground truth hotel scoring beyond aggregated reviews  
* Platform-level service guarantees and refund workflows

────────────────────────────────────────────────────────────────────────────────

**04  TARGET USER & VALUE PROPOSITION**

────────────────────────────────────────────────────────────────────────────────

## **4.1  Primary Persona — Aarav Sharma**

**The Connected But Constrained Group Traveller**

| Dimension | Profile |
| :---- | :---- |
| Age & Location | 32 years old | Tier 1 Indian city (Bangalore / Jaipur / Delhi) or Indian expat in the US |
| Life Stage | Recently married or young parent (child 0–5 years). Transitioning from spontaneous travel to planned, constraint-driven group travel. |
| Occupation | Mid-senior professional (Product Manager, Software Engineer, Tech Manager). Comfortable with apps and digital tools. |
| Travel Frequency | 2–3 domestic trips per year; 1 international trip every 1–2 years. Group size: 4–8 adults (+ kids). |
| Travel Style | Comfort-first; not a budget backpacker. Prefers Airbnb for family flexibility. Values experiences and calm over itinerary density. |
| Planning Role | Passive-to-moderate participant. Comfortable delegating planning but wants to be consulted before decisions are finalized. |
| Primary Tools | WhatsApp (coordination), Google (research), MakeMyTrip / direct airline (booking), Airbnb (stays), Splitwise (expenses), ChatGPT (emerging, itinerary ideas) |
| Budget Behaviour | Has a clear private budget floor but won't state it openly. Uses indirect signals (price of suggested options) to indicate affordability. |
| Top Goal | Have a trip where the whole group enjoys themselves — including members with different preferences — without it becoming a management project for one person. |
| Core Frustration | Silent misalignments (budget, food, activities) are baked in before the trip starts. No safe, early mechanism to surface and resolve them. |

## **4.2  What This User Needs**

* **Needs a way to collect group preferences without social awkwardness:** Budget, dietary, mobility, and activity preferences — collected before planning begins, anonymously if needed  
* **Needs planning load to be shareable, not concentrated on one person:** Assign tasks, track status, reduce coordinator burnout through structure and automation  
* **Needs reliable ground-truth about destinations and stays:** Especially for off-grid, mountain, or international travel with young children  
* **Needs expense clarity before and during the trip:** Pre-split fixed costs; automated tracking for variable expenses; no manual entry  
* **Needs to plan for flexibility — both together and as sub-groups:** Structured divergence planning, not just ad hoc WhatsApp coordination

## **4.3  Value Proposition**

Fix the silent coordination failures of group travel — budget misalignment, organizer burnout, and fragmented planning — by creating the first AI-native group trip coordination platform that makes it safe and frictionless to align on preferences before planning begins, distributes the planning load across all members, and maintains a single source of truth throughout the trip lifecycle.

| Customer Job | Current Pain | Our Gain | Pain Relieved |
| :---- | :---- | :---- | :---- |
| Get the group to agree on a budget | Social awkwardness; indirect proxy signals; mid-trip conflict | Anonymous budget range poll with AI-synthesized group consensus | Silent misalignment eliminated before planning starts |
| Coordinate dietary and trip style preferences | Discovered on-ground; leads to conflict and bad experiences | Upfront constraint onboarding at trip creation — structured checklist | Preference gaps surfaced in 2 minutes, not 2 days into the trip |
| Distribute planning work fairly | 1 person does everything; others critique after arrival | Task assignment with completion tracking; role-based expense ownership | Organizer burnout reduced; passive members become active contributors |
| Track and settle expenses | Manual Splitwise entry abandoned mid-trip; post-trip disputes | Category-based pre-assignment of fixed costs; auto-tracking for variables | Splitwise manual friction eliminated; settlement in 1 tap post-trip |
| Maintain one shared plan everyone can see | Decisions buried in WhatsApp; no one knows the current plan | Single group dashboard: destination, dates, itinerary, costs, tasks | Everyone always knows what's decided and what needs input |

────────────────────────────────────────────────────────────────────────────────

**05  SOLUTION & CORE FEATURES**

────────────────────────────────────────────────────────────────────────────────

## **5.1  Solution Summary**

Fix the coordination tax of group travel by building an AI-native group trip coordination platform — from the first 'let's go\!' message to the final expense settlement — so that every member of the group arrives at the destination already aligned on budget, dietary preferences, and daily plans, without one person absorbing all the cognitive load.

## **5.2  Core User Loop**

| Step | Action | System Response | Outcome |
| :---- | :---- | :---- | :---- |
| 1\. Create | One person creates a trip and invites group via WhatsApp link | Trip workspace created; all members receive one-tap join link | Group enters a shared coordination space in under 30 seconds |
| 2\. Align | Each member completes an anonymous preference survey (budget, diet, travel style, constraints) | AI synthesizes responses into group-level insights; shows overlap and gaps without revealing who said what | Budget ranges and preference overlaps visible to all; no awkward conversation needed |
| 3\. Decide | Group votes on destination shortlist, dates, and accommodation options | AI generates contextual destination options matching group preference synthesis; voting with deadlines and nudges | Decisions made within days, not weeks; passive members nudged with one-tap actions |
| 4\. Plan | Organizer assigns planning tasks to group members (flights, accommodation, food, transport) | Task tracker shows status; automated reminders to assigned members; AI suggests itinerary based on confirmed preferences | Planning load distributed; no single point of failure; progress visible to all |
| 5\. Trip | Group accesses live itinerary; expense logging; sub-group coordination | Shared day-by-day itinerary; category-based expense tracking with auto-split; sub-group schedule view | No one needs to be GPS \+ concierge \+ accountant; organizer can enjoy the trip |
| 6\. Settle | Post-trip expense settlement | Automatic calculation of who owes whom based on category ownership \+ variable expenses; one-tap UPI settlement | No lingering debts; Splitwise-level clarity with zero manual entry |

## **5.3  Feature Roadmap by Priority**

| Opportunity Area | Problem It Solves | How It Works | Priority |
| :---- | :---- | :---- | :---- |
| Anonymous Preference Polling | Silent budget misalignment; dietary discovery failures | Member completes private survey (budget range, dietary type, trip style, mobility). AI shows group aggregate — not individual answers. Reduces social awkwardness. | P0 |
| Upfront Constraint Onboarding | Preferences discovered too late; on-ground conflict | At trip creation, structured checklist prompts all members to declare constraints. Completed before any planning begins. | P0 |
| Planning Load Distribution | Organizer tax; single point of failure | Task board where organizer assigns sub-tasks (flight research, stay booking, food planning) to group members. Completion tracked with nudges. | P0 |
| Single Group Dashboard | Fragmented information across 4–5 tools | One screen: destination, confirmed dates, day-by-day itinerary, budget status, task status, decisions pending. Mobile-first. | P0 |
| Integrated Category-Based Expense Tracking | Splitwise manual entry fatigue; post-trip disputes | Pre-assign expense categories to members (Person A \= accommodation, Person B \= food). Auto-calculate variable splits. One-tap UPI settlement. | P1 |
| Structured Sub-Group Itinerary Planning | Group divergence managed only ad hoc via WhatsApp | Enable parallel day tracks: 'Morning together, afternoon split, dinner together.' Each sub-group has its own schedule; common timeline shows reunion points. | P1 |
| AI Trip Concierge for Group Decisions | Decision bottleneck; months-long planning cycles | AI aggregates preferences and generates 2–3 contextual destination and itinerary options with cost-benefit tradeoff. Mediates group decisions without interpersonal tension. | P1 |
| Passive Member Nudging | 70%+ of planning happens on mobile in 2–3 min windows; passive members disengage | Push notifications with one-tap actions ('Vote now', 'Confirm your diet preference'). No app-open required for basic inputs. | P1 |
| Mountain / Off-Grid Travel Advisories | Google Maps unreliable for mountain terrain, landslides | Crowd-sourced road conditions, landslide alerts, and network dead zones for Himalayan and off-road routes from recent travellers. | P2 |
| Ground Truth Hotel Scoring | Highly reviewed properties deliver poor actual service | Aggregates reviews from last 30 days \+ local travel forums \+ complaint threads. Shows 'recent ground truth' score alongside star ratings. | P2 |
| Kids-Friendly Trip Filter Layer | Family constraints require manual Google research for each location | Layer onto destination/stay search: stroller-friendliness, kitchen access, kid menus, proximity to medical facilities. | P2 |
| Platform-Level Service Guarantee | Non-refundable bookings on bad properties trap groups | In-app escalation for stay quality failures with pre-negotiated alternatives and partial refund workflows. | P2 |

## **5.4  MVP Scope (V1 — P0 Features Only)**

V1 ships only P0 features. The goal is to validate the core thesis: that removing the social friction of preference collection changes group planning behavior.

| V1 In Scope | V1 Cut (Reason) |
| :---- | :---- |
| Anonymous preference polling (budget range, dietary, trip style) | Mountain / off-grid advisories — requires data partnerships |
| Upfront constraint onboarding checklist | Ground truth hotel scoring — requires review aggregation pipeline |
| Planning task board with assignment \+ tracking | Platform service guarantees — requires vendor contracts |
| Single group dashboard (destination, dates, itinerary, task status) | AI Trip Concierge — ship preference polling first; AI layer in V2 |
| Basic expense tracking (category-based pre-assignment) | Kids filter layer — nice to have; not core to thesis |
| WhatsApp-based group invite flow (zero onboarding friction) | Sub-group itinerary planning — design complexity; V2 |

## **5.5  Technology Stack**

| Layer | Technology | Why | Backup |
| :---- | :---- | :---- | :---- |
| Frontend (Mobile) | React Native | Mobile-first; 70%+ planning on mobile; one codebase for iOS \+ Android | Flutter |
| Backend / API | FastAPI (Python) | Fast iteration; async support; Python ecosystem for AI integration | Node.js / Express |
| Database | PostgreSQL (Neon) | Relational data model for trip/task/expense relationships; serverless scaling | Supabase |
| AI Layer | Claude API (Anthropic) | Preference aggregation and synthesis; group decision framing; itinerary generation | OpenAI GPT-4o |
| Real-time Sync | Supabase Realtime / WebSockets | Live updates for group dashboard; task completion notifications | Firebase |
| Authentication | Auth.js (OAuth) | Google \+ WhatsApp number login; zero friction for Indian users | Clerk |
| Payments | Razorpay (UPI) | UPI-native for India; expense settlement flow | Cashfree |
| Hosting | Railway / Vercel | Simple deploy; auto-scaling; zero DevOps overhead for MVP | Render |

────────────────────────────────────────────────────────────────────────────────

**06  METRICS, IMPLEMENTATION & RELEASE**

────────────────────────────────────────────────────────────────────────────────

## **6.1  Success Metrics**

| Stage | Definition | V1 Target | Why It Matters |
| :---- | :---- | :---- | :---- |
| Activation | Group completes anonymous preference survey (all members) | 60% of invited members respond within 48h | Core thesis validation: removing social friction changes behavior |
| Engagement | Group returns to dashboard for 3+ planning sessions per trip | 50% of created trips reach 3+ sessions | Measures whether the platform becomes the coordination default |
| Decision velocity | Groups reach destination decision within 7 days of trip creation | 40% of trips decide destination within 7 days | Addresses the 'death zone' inactivity problem |
| Organizer NPS | Net Promoter Score from the trip organizer post-trip | NPS \> 40 (organizer specifically) | If organizer experience improves, product is solving the right problem |
| Expense settlement | Post-trip expenses settled via app within 7 days | 60% of trips complete settlement in-app | Validates integrated expense tracking over Splitwise |
| North Star | Trips completed without silent misalignments surfacing mid-trip | Qualitative — measured via post-trip survey: 'Did any surprise conflict arise?' | The ultimate outcome this product is designed to prevent |

## **6.2  Implementation Plan — Phased Build**

| Phase | Deliverable | Duration | Test Gate | Key Risk | Fallback |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Phase 1: Foundation | Trip creation, WhatsApp invite flow, group dashboard skeleton | Week 1–2 | Can a group of 5 create a trip and all join via WhatsApp link in under 2 minutes? | WhatsApp API rate limiting | Use generic share link \+ manual copy-paste invite |
| Phase 2: Preference Layer | Anonymous preference survey, AI synthesis of budget \+ dietary inputs | Week 2–3 | Do 60%+ of invited members complete the survey? Does AI synthesis display correctly? | AI hallucination in preference synthesis | Fallback to manual rule-based aggregation (avg \+ mode) |
| Phase 3: Planning Tools | Task board, assignment, tracking, itinerary builder | Week 3–4 | Can organizer assign 5 tasks to 5 members and all receive notifications? | Passive members ignoring notifications | WhatsApp nudge fallback \+ email digest |
| Phase 4: Expense Layer | Category pre-assignment, variable expense logging, settlement calculation | Week 4–5 | Can group settle all expenses in under 5 taps post-trip? | UPI integration delays (Razorpay onboarding) | Export to WhatsApp summary; manual UPI settlement |
| Phase 5: Polish \+ Launch | Mobile UI polish, error states, onboarding flow, beta testing with cohort | Week 5–6 | End-to-end test: create trip → preference poll → task assignment → expense settlement | Low beta engagement | Pre-load with 2 sample trips to demonstrate flow |

## **6.3  Risk Register**

| Risk | Likelihood | Severity | Mitigation | Fallback |
| :---- | :---- | :---- | :---- | :---- |
| Passive members still don't engage with preference survey | High | Critical | One-tap WhatsApp response; no app-open required for basic inputs; social proof ('4 of 6 members responded') | Show partial synthesis to motivate remaining members |
| Organizer skips onboarding and goes straight to WhatsApp anyway | High | High | Make first WhatsApp message itself a deep link into the app flow | Accept WhatsApp as entry; product adds structure from that point |
| AI preference synthesis feels wrong or weird to users | Medium | High | Show confidence levels; allow organizer to override; frame AI as 'assistant, not decider' | Fall back to simple bar charts showing distribution of responses |
| Budget misalignment still surfaces despite anonymous poll | Medium | Medium | After poll, show a 'budget gap alert' if range spread is \>40%; prompt discussion before destination selection | Manual override: group can set a joint budget ceiling |
| UPI / Razorpay onboarding delays MVP | Low | Medium | Apply for Razorpay early in development cycle | V1 ships without in-app UPI; export expense summary to WhatsApp for manual settlement |

## **6.4  Release Strategy**

* V1 (MVP — 6 weeks): P0 features only. Ship to cohort group \+ 2–3 real friend groups as beta users. Validate preference survey completion rates and decision velocity metrics.  
* V2 (4 weeks post-V1): Integrated expense tracking (category-based), AI Trip Concierge (destination \+ itinerary synthesis), passive member nudging with one-tap WhatsApp actions.  
* V3 (8 weeks post-V2): Sub-group itinerary planning, mountain/off-grid advisories (data partnership), ground truth hotel scoring, kids-friendly filter layer.  
* V4 (Strategic): Platform accountability layer, service guarantees, B2B corporate group travel (separate product line with compliance features).

────────────────────────────────────────────────────────────────────────────────

**A  APPENDIX — INTERVIEW SOURCES**

────────────────────────────────────────────────────────────────────────────────

## **A.1  Interview Participants**

| Interviewee | Profile | Trip Context | Key Contribution |
| :---- | :---- | :---- | :---- |
| Sabya | Senior PM, Seattle, US; 2 kids (ages 3 & 5\) | 2-family domestic trip (rural US, 2.5 days) | Budget proxying via Airbnb selection; anonymous survey idea; Zoom pre-trip call suggestion |
| Gaurav Gupta | Tech/PM, ex-startup founder, Bangalore | 4–5 office colleagues, Bir Billing HP, 5 days (sole driver) | Budget-first planning; escrow model; driver fatigue (cross-validated with Rohit); mountain road data gaps |
| Aashik Villa | Tech professional, Bangalore | 8-person Kerala trip | Organizer burnout; passive participation → post-trip criticism; last-minute cancellation impact |
| Gajalakshmi P | Professional, India/US | 3-family multi-family international (Greece/Italy/UK evaluation) | Budget overrun pattern; kid-constrained itinerary; multi-origin coordination; group splinter strategy |
| Rahul Kumar | Professional, India | 5-person family group, Kerala (Varkala) | Non-refundable booking trap; expense split evolution (3 failed approaches); kid-first accommodation constraint |
| Rohit | Office colleague, Bangalore | 4 people, Bir Billing HP (same trip as Gaurav Gupta — independent cross-validation) | Cross-validates driver fatigue and dietary misalignment from same trip; Splitwise usage confirmed |

*All interviews conducted via video call and transcribed using Otter.ai. Conducted by Gaurav Gupta as part of the Rethink AI MPM Cohort 7, Week 7 primary research exercise, March 28–30, 2026\.*

## **A.2  Secondary Research Sources**

| Source | Key Data Used |
| :---- | :---- |
| Growth Market Reports (2024) | Global group travel market: $168.7B (2024), CAGR 7.2%, projected $314.7B by 2033 |
| IMARC Group (2024) | India travel & tourism: $22.47B (2024); Online travel: $51B (2024) at 9.3% CAGR |
| Phocuswright Global Travel Market Report (2025) | Travel gross bookings $1.6T (2024); online bookings grew 9% in 2024 |
| TravClan India Outbound Travel Index 2025 | Non-metro cities \= 63% of India's outbound travellers; Tier 2/3 dominating growth |
| Skift Research (2025) | Record $13.1B raised by travel startups in 2024; 45% of travel-tech VC to AI by mid-2025 |
| Collinson International 2024 Travel Benefits Report | Indian Millennials spend $6,031/year on travel \= 34% of annual expenses |
| TakeUp AI, Rise of AI-Planned Travel 2026 | 38% of travelers have used AI; 94% trust AI recommendations; 84% would book based on AI |
| Inc42 (2024) | India travel tech startups: 182.2% YoY funding jump to $600M across 29 deals in 2024 |
| Booking.com Consumer Survey (2025) | 91% of travellers still have concerns about AI; only 35% fully trust AI outputs |
| Jeng & Fesenmaier (2002) | Travel decision-making is hierarchical, contingent, and funnel-like — each decision blocks the next |
| Zhuang et al. (2024) — International Journal of Tourism Research | Poor planning and financial burdens directly and negatively impact travellers' mental health |
| EY Indian Travel Research | Two personas: Gen ACE (under 40, adventurous) and Gen LUX (over 40, family-oriented, luxury) |
| Storyboard18 / TRAI (2025) | 660M+ smartphone users in India (2024); mobile data cost ₹9/GB (from ₹269/GB in 2014\) |

*All secondary research compiled and synthesised in March 2026 as part of the Rethink Systems Cohort 7, Week 7 case study. This document is the individual PRD submission of Gaurav Gupta.*

# Tab 2

Some more ideas \- 

* Location based AI Helper \- based on location, platforms AI bot will keep helping the users by providing suggestions related to road/weather conditions, sight-seeing worthy spots, eateries, ATMs, Restrooms, etc  
  * This will send alarms/notifications for ‘Kid Friendly’ or ‘Female only Group’ tagged trips about risky locations  
* Trip optimizer \- AI based recommendation engine which will nudge each and every member to help them get the best out of the trip.  
  * Every person will be filling an anonymous form which will help create a profile for AI engine to use and provide personalise suggestions. These suggestions will help in getting some unique personal experiences which other group members might not want to enjoy as a group but individual members may prefer.
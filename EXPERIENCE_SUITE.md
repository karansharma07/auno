# AUNO 3.0 — Eight signature experiences

## Shipped as a functional browser-only demo

All new modules share a small, dependency-free demo store in `docs/suite.js` (mirrored under `static/suite.js` for the local FastAPI pilot). State survives page reloads in **this browser only** and is separated by fictional persona. There are **no real messages, accounts, payments, payouts, storage bookings, venue availability or shared records** in the new feature modules.

| Experience | New demonstrable journey | Production dependency |
|---|---|---|
| **AUNO Now** | Existing time/mood/budget suggestions; accessible via the AUNO Life hub | Verified business data, live inventory, routing |
| **Together** | Interest-ranked 8–12-person sample circles, join/leave, sample RSVP; capacity boundary and membership prerequisite | Operator-reviewed circle series, attendance, real scheduled sessions, safeguards |
| **Passport** | Eight progressive stamps derived from sample community memberships, host check-ins, saved places, Together and Homebase | Server-authoritative stamps, fraud resistance, audit and dispute handling |
| **Concierge** | 1–5-day itineraries, interest/pacing/budget settings, sample time windows, saved plans, removable stops, clipboard summary | Live hours/transit, licensing checks, itinerary constraint solver, live bookings |
| **Local Lens** | Seven curated sample places, save/helpful, category filters, resident tips and local demo moderation | Trusted provenance, licences/source timestamps, content safety, place data |
| **Homebase** | Ten-step newcomer checklist, completion progress, official resource links | Localisation, official resource freshness, source owner and consent model |
| **HostOS** | Host activity KPIs, per-event occupancy, reusable event templates, prefilled create-event modal, preparation checklist, CSV | Multi-tenant secure host data, real schedules, qualified organiser/permit verification |
| **for Business** | Four use cases, sample pilot proposal form, sample operations approval queue | Organisation verification, CRM, pricing contracts, invoicing, procurement |

All interfaces are responsive and inherit the working System / Light / Dark appearance preference from 2.0.

## What goes where

- `docs/`: public GitHub Pages build. Load `suite.css` and `suite.js` before `app.js`. All new actions are browser-local, never customer operations.
- `static/`: mirrored UI loaded by local FastAPI pilot; new suite actions still run locally in the browser.
- `supabase/migrations/202611060002_experience_suite.sql`: forward-compatible **schema/RLS/RPC scaffolding** for private journeys, curated recommendations, recurring circles, Passport evidence, Homebase progress, HostOS templates and business pilot applications. **Not deployed and not wired to public frontend**. Requires complete RLS, concurrent update and threat modelling review before signups.
- `BRAND_SYSTEM.md`: tone, verbal identity, naming architecture and visual tokens, subject to legal clearance.

## Recommended next development sprint

1. **Native live-alpha modules:** connect the Supabase-authenticated `live/` frontend to the new tables through strictly scoped policies and mutation endpoints. Use separate staging/production projects and browser E2E tests with multiple real accounts. Avoid direct browser-wide SELECTs of partner or member details.
2. **Trust:** verified operators, host reviews, report escalation and audited permissions. Identity verification is distinct from social character/reputation.
3. **Real community scheduling:** circle meetings, calendar invitations, RSVP limits, actual check-ins, no-show policies and notifications; durable audit trails.
4. **Journey intelligence:** geocoded place catalogue, source freshness, official hours, cost and travel-time constraints, airport buffer; licensed guides for professional tour products.
5. **Commercial:** event payments, disputes, refunds, financial ledger, partner agreements; storage requires prior licencing/insurance/custody review.
6. **Go-to-market:** 10 vetted organisers, weekly repeat events, an opt-in pilot and measured 30-day repeat attendance; show true data only when live.

## Local run and QA

```bash
cd auno-3
python3 -m http.server 8080 --directory docs
# Open http://localhost:8080

node scripts/verify-static.mjs
python -m pytest tests -q
node tests/test_v2_ui.cjs
node tests/test_pages_demo.cjs
```

To upgrade the existing repo with Visual Studio, unzip the upgrade patch into the repository root (keep `.git` intact), review, commit, and push. If Pages is configured for `main` → `/docs`, it redeploys after the commit. If it is configured for GitHub Actions, the included `.github/workflows/pages.yml` handles the deployment.

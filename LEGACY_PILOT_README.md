# AUNO 2.0 — The people-powered city companion

## What's new in AUNO 2.0

- Premium **System / Light / Dark** design with preference persistence and responsive visual polish.
- **AUNO Now:** mood-, time- and budget-aware curated demo discovery.
- **Mission Control:** interactive charts, real browser-demo event analytics, occupancy, trust queues, CSV export and a transparently hypothetical monetisation calculator.
- Installable static demo manifest, icons and offline service-worker shell.
- New **`live/` secure alpha** backed by Supabase Auth + PostgreSQL with Row Level Security, pending host/community review and free-event booking RPCs. This **does not** enable payments or luggage custody.
- Read [`RELEASE_NOTES_V2.md`](RELEASE_NOTES_V2.md), [`LIVE_ALPHA_SETUP.md`](LIVE_ALPHA_SETUP.md) and [`BUSINESS_MODEL.md`](BUSINESS_MODEL.md) for release, activation and commercial plans.

## GitHub Pages deployment (public, browser-only demo)

This project contains a standalone Pages-compatible version under [`docs/`](docs/), with the same UI and local-only simulated activity/community/social/storage workflows. It is ready to publish through the included GitHub Actions workflow; see **[GITHUB_PAGES.md](GITHUB_PAGES.md)**. The website does not run the Python backend and does not share data between visitors. It is not a real booking or identity-verification service.


**Working interactive full-stack pilot (v2.0 demo UI; v0.1 backend workflows)** | Dubai-first | Provisional brand name

> AUNO helps residents and visitors find people, communities, experiences, places, and helpful local services. This deliverable is a **local, interactive software prototype** with a FastAPI backend, SQLite persistence, and responsive, dependency-free frontend. It is **not** a live marketplace and must not be deployed publicly in its current form.

## Run it locally

Python 3.10+ is required.

```bash
# From the extracted project / cloned repository root
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Open **http://127.0.0.1:8000** in a browser. On first run, the local SQLite database is created with **fictional** people, activities, communities, example partners, and rewards.

On macOS/Linux, you can alternatively run `./run.sh`. On Windows, run `run.bat`.

See `INTERFACE_CONCEPT.png` for an **illustrative UI composition** (not a browser screenshot).

## What you can actually do

| Workspace | Working capabilities |
| --- | --- |
| Member | Resident / visitor mode, tailored home, searchable activity discovery, event booking and cancellation, joining circles, applying to create new communities, social plans, discovery of people, connection requests, sharing and liking Moments, reporting content, saved itinerary generation, demonstration storage reservations, XP rewards and notifications |
| Community host | Publish activities, see booking totals, check in attendees and issue XP, approve/reject private-circle membership requests |
| Storage partner | See demo locations and reservations, adjust rates/hours/capacity, record bag drop-off and collection |
| Platform operations | See overview metrics and member registry; approve/reject community applications; review reports; moderate Moments; pause/restore activity listings |

Click the avatar in the upper-right to **switch demo personas**: Maya (member), Omar (organiser), Leila (partner), and AUNO Operations (admin). Sofia is a sample visiting member who can accept connection requests.

### Demonstrate connected end-to-end journeys

**Community approval:** Member → Communities → Start a community → Submit. Switch persona to Operations → approve. Return as member → see approved circle.

**Private community approval:** Member Maya → Communities → Shutter Society → request membership. Switch to Omar → Host Studio → approve request. Return to Maya.

**Sports booking / participation:** Maya → Discover → Padel & People → reserve. Switch to Omar → Host Studio → Check in. Return to Maya → Rewards to see XP increase. (The check-in button is a demo simulator and does not verify physical attendance.)

**Luggage operations:** Maya → Luggage storage → reserve a mock partner location. Switch to Leila → Partner Studio → mark dropped off → confirm collected. Return to Maya → view status. All location details and prices are fictional.

**Social introduction:** Maya → People → request Sofia. Switch to Sofia → People → accept. Return to Maya → see connected status.

**Itinerary planning:** Maya → Journeys → choose duration, neighbourhood, interests, budget and pace → Build. The itinerary is saved in SQLite and uses a **curated, deterministic** recommendation baseline, not live AI or real-time data.

**Content moderation:** Maya → Moments → Share a moment. Switch to Operations → hide the post, or use member reporting and then resolve the report.

## Reality check / not yet integrated

- **No real signup, login, access tokens, OAuth, MFA or KYC.** `X-Demo-User` is an intentionally insecure persona-selection header used only for the demo.
- **No live venue partnerships, reservations, payments, refunds, settlement, insurance, or baggage custody.** Sample prices and locations are fabricated.
- **No production WhatsApp API integration.** The `Share via WhatsApp` control opens a user-approved share link only; it does not send messages or manage groups.
- **No live AI agent, map routing, flight tracking, business hours, ticket availability or connected flight/booking providers.** Journeys use locally curated sample places and transparent heuristics.
- **No real social messaging or automated verification.** Connections require consent, but the secure messaging system is a future deliverable.
- **No audited production safeguards**, including proper identity storage, moderation staff workflow, fine-grained auth, observability, rate limiting, backup/restore, fraud detection and event permits.

Do **not** collect real identity documents, baggage, payment details or customer data in this pilot.

## Test it

```bash
python -m pip install pytest httpx
python -m pytest tests -q
```

Seven integration tests cover the demo's role boundaries, community approval, event booking, storage handoff, itinerary creation, social consent, rewards and moderation.

## Project structure

```text
auno-platform/
├── app.py                     # FastAPI app, SQLite domain models and REST routes
├── live/                      # Supabase-backed free-event alpha (separate from demo)
├── supabase/migrations/       # RLS + audited, capacity-safe booking RPCs
├── scripts/                   # Static publishable configuration build tool
├── static/
│   ├── index.html             # SPA shell
│   ├── app.js                 # Interactive client with connected workflows
│   ├── styles.css             # AUNO design system and responsive UI
│   ├── favicon.svg
│   └── assets/*.svg           # Original offline-ready vector artwork
├── docs/                      # GitHub Pages static interactive demo
├── .github/workflows/pages.yml  # Static Pages deployment
├── GITHUB_PAGES.md
├── tests/test_workflows.py    # Backend API integration tests
├── requirements.txt
├── run.sh / run.bat
├── PRODUCT_BLUEPRINT.md
├── ARCHITECTURE.md
├── PRODUCTION_GATES.md
└── ROADMAP.md
```

## Data / reset

The demo creates `auno_demo.db` beside `app.py` when it starts. Stop the server and delete this file to reset all fictional data. It is excluded from the deliverable archive so each install begins cleanly.

## Naming / legal

**AUNO is a working name, not a trademark clearance.** Check UAE and international trademark registries, Arabic linguistic interpretation, domain inventory and app-store conflicts before committing to it.

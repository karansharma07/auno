# AUNO — Connected city experience platform

**Release:** real-data alpha foundation + preserved AUNO 3.0 demonstration. **Status:** deployable source, not yet a commercially certified public-launch system.

## Routes

- `/auno/` — real Supabase-backed application frontend (when configured). Without a Supabase project, a branded public homepage appears. No fictional transactions or users are loaded here.
- `/auno/demo/` — preserved AUNO 3.0 interactive demonstration with fictional data, fully isolated from live accounts.

### Do this first

Read [PRODUCTION_SETUP_A_Z.md](PRODUCTION_SETUP_A_Z.md). It covers the GitHub push, three SQL migrations, Supabase email auth, GitHub Actions variables, Pages deployment, first operator grant, two-account testing and eventual Cloudflare hosting.

**This repository is not already live:** it requires your Supabase project credentials and migration execution; the connected GitHub integration is read-only and cannot push this build for you. Paid transactions, identity verification and luggage custody remain off until licensed, secured integrations exist.

## Quick local preview

```bash
node scripts/build-pages.mjs
python -m http.server 8080 --directory docs
# browse http://127.0.0.1:8080/ and http://127.0.0.1:8080/demo/
```

Generate the real frontend config for your Supabase alpha by running `node scripts/build-pages.mjs` with **public** `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` environment variables. Never use a service-role key in client code. The GitHub Actions workflow injects the two values from repository **Actions variables**.

## Source layout

```
live/                    # Production frontend (real Auth, RLS-backed data)
demo-static/             # Frozen 3.0 browser-only simulator
docs/                    # Generated Pages output: root app + /demo/
supabase/migrations/     # Ordered SQL schema, policies and secure functions
scripts/build-pages.mjs  # Deterministic dual-route build
scripts/verify-static.mjs
tests/                   # Legacy, live-route and UI checks
.github/workflows/       # GitHub CI + Pages publishing
app.py, static/          # Legacy local FastAPI/SQLite demonstration (NOT hosted)
```

## Genuine features in the real-data alpha

- Magic-link email authentication and persisted sessions.
- Private profile, opt-in discovery, mutual introduction requests and reciprocal blocks.
- Reviewed communities, free events, capacity-locked booking and cancellation.
- AUNO Now filtering **actual published** event records.
- Together recurring circle proposals, operator approval, join/leave.
- Passport stamps awarded by authorised recorded check-in (not self-issued).
- Concierge private saved journeys built from approved member recommendations (not live AI route optimisation).
- Local Lens moderated user recommendations and personal saved places.
- Homebase private user-defined tasks.
- HostOS event templates for approved community owners.
- Business pilot enquiries with private contact details and operator review.
- Admin real-data metrics, monthly charts, check-in, content review, privacy request queue.
- System/light/dark, responsive UI and installable PWA metadata.

**Missing on purpose:** paid bookings, payments/refunds/payouts, real storage partners, ticket/venue licensing, live routing, commercial AI concierge, KYC, automated WhatsApp, identity document retention and production support/backup guarantees. These cannot responsibly be represented as working without actual accounts, contracts, compliance and operational checks.

## Tests

```bash
node scripts/build-pages.mjs
node scripts/verify-static.mjs
node tests/test_pages_demo.cjs
node tests/test_v2_ui.cjs
node tests/test_live_suite.mjs
python -m pytest tests -q
# optional against a provisioned project (publishable key only):
node scripts/verify-supabase.mjs
```

See [PRODUCTION_RELEASE_NOTES.md](PRODUCTION_RELEASE_NOTES.md) and [SECURITY_AND_LAUNCH_GATES.md](SECURITY_AND_LAUNCH_GATES.md) for exact scope and open gates. Older pilot explanations remain in [LEGACY_PILOT_README.md](LEGACY_PILOT_README.md).

## Hosting policy and real costs

GitHub Pages is a static showcase service and is **not intended or allowed as free hosting for a commercial online business/marketplace/SaaS**. Keep GitHub as source control, and migrate the active commercial site to Cloudflare Pages or another appropriate host. Supabase free tier is appropriate for development/controlled pilots but may pause and does not replace supported backups, monitoring, legal compliance or safety operations.

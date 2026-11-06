> **Historical AUNO 2.0 guide.** Current dual-route release instructions are in [PRODUCTION_SETUP_A_Z.md](PRODUCTION_SETUP_A_Z.md). The `/docs` path now contains generated live-root + preserved `/demo/`, not the old demo root.

# AUNO 2.0 — live alpha: minimal-setup deployment

**Important:** This is a secure *starting implementation* for free-event participation, not a certified production launch. Do not activate paid bookings, verified identity claims, live chat, professional tourism, or luggage custody using the demo workflows.

## Components

- `/docs`: polished GitHub Pages **fictional browser-local demo** (safe for showcasing, not real identity/payment service).
- `/live`: separate **Supabase-backed alpha** with magic-link email auth, personal profiles, approved communities, free-event bookings, user-hosted draft proposals and access-controlled admin review.
- `/supabase/migrations/202611060001_foundation.sql`: Postgres schema, RLS, limited column permissions and audited RPCs for concurrency-safe free booking.
- `/app.py` + `/static`: original local FastAPI pilot (intentionally insecure demo identity selection; never host it publicly).

## Set up a real free-event alpha

1. Create a **new Supabase project** on its free plan in a region reviewed for your privacy/data-transfer requirements. Confirm the free plan limitations, email quotas and auto-pause before inviting users.
2. Open **SQL Editor**, review and run `supabase/migrations/202611060001_foundation.sql` once. Prefer a migration/deployment tool for subsequent changes; do not manually drift production schema.
3. In **Authentication → Providers**, enable email and confirm magic-link sign-in. Configure **Authentication → URL Configuration** so both your local staging URL and eventual deployed live URL are allowlisted. Confirm your email delivery limits and test real emails.
4. For local tests, copy `live/config.example.js` to `live/config.js`. Set `supabaseUrl` and the **publishable/anon key** from your project settings. These two fields are public browser configuration, **not** server secrets. **Never use the service-role key or database password in browser files.**
5. For a quick local smoke test from repository root, run `python -m http.server 8080` and open `http://localhost:8080/live/`. Sign in with your email link. Confirm your profile is created, and test sign-out and sign-in again.
6. Create your first community and event draft from **Host studio**. They remain pending/draft and are intentionally **not visible** as available events until approved.
7. Grant a founder operator role manually, **after** you have signed in and found your UUID in the Supabase Authentication dashboard. In a trusted SQL editor:

   ```sql
   insert into public.operator_accounts(user_id)
   values ('THE-VERIFIED-FOUNDER-AUTH-UUID')
   on conflict (user_id) do nothing;
   ```

   Never use a browser button or client metadata to grant operator rights. Protect operator sign-in with a documented MFA and access-review procedure before public launch.
8. Refresh the app. The **Mission Control** tab is available only if `is_operator()` returns true. Approve the submitted community and publish a properly reviewed **free** event.
9. Sign in from a second browser/account. Verify the real database presents the same published community/event, and that the second member can reserve/cancel a free spot. Try to read another member's private bookings with the first account; RLS should deny that.
10. Create a Cloudflare Pages project connected to this GitHub repository. Use the repo root as project root, build command `node scripts/generate-client-config.mjs`, and output directory `live`. In Pages **Environment variables**, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to the Supabase project URL and publishable/anon client key. The build script generates `live/config.js` automatically. Cloudflare Pages hosts the static frontend and Supabase hosts auth/data/RPCs. The browser key is publishable, but always keep database/service-role keys entirely server-side. Use separate Supabase projects/settings for staging and production.
11. Add the live Cloudflare URL to **Supabase Auth URL Configuration**, test email-link redirection, and verify everything through the public HTTPS URL. Keep production/staging project credentials separate.
12. Add DNS/custom domain later. Do not move the GitHub Pages demo to the live URL until the sign-in, RLS, booking, admin-access, operations and privacy reviews have passed.

## What is actually included in the live alpha

- Real Supabase email OTP/magic-link login and persisted sessions
- Personal profile with opt-in discovery (`discoverable=false` by default)
- Public-to-members approved community and event catalogue
- Community applications with operator review
- Free events only; capacity-safe booking via locked Postgres RPC
- Cancellation and personal booking history
- User-authored event proposals remain drafts until operator review
- Basic real-data operator dashboard and moderation queue readout
- System/light/dark appearance stored on device

**Not included:** paid booking/payment provider, real identity verification, venue contracts or permits, member chat, WhatsApp Business API, AI itineraries with live data, real luggage inventory or custody, refunds, partner payouts, comprehensive customer support, backup/recovery, production security audit, automated abuse detection, or production-grade privacy/consent lifecycle.

## Free-tier realities

A reasonable first alpha may fit inside free plans for GitHub, Cloudflare Pages and Supabase. **Free is not a service-level agreement.** The limits, inactivity pauses, email-send allowances and overage rules can change; verify current pricing before relying on them. Even a tiny commercial platform has non-free obligations: entity/license setup, contracts, event permits where applicable, safety and moderation, insurance, security review, payments, tax, and customer support.

Move off the free database plan once there are real users relying on it for bookings. Establish automated backups, test restores, incident alerting, server-side request throttling and an operating support plan. Document UAE PDPL/cross-border data-transfer basis before accepting real accounts.

## Test cases before broader invitation

- Anonymous visitor is not granted member data access.
- Member cannot self-assign operator access, publish events, approve groups or inspect private bookings.
- Community applications are invisible to other non-operator members until approved.
- Two members can join independent events; over-capacity concurrent requests cannot overbook.
- Paid events must produce a clear "not enabled" error.
- Cancelled booking no longer consumes a seat.
- Failed/expired email links show a recoverable sign-in action.
- Dark/system/light modes are readable on small screens and keyboard-only navigation.
- Broken network/offline displays useful errors and never suggests a booking was confirmed unless the server agreed.

## Why two sites initially?

The GitHub Pages site uses `X-Demo-User` and per-browser localStorage on purpose to demonstrate roles without signup. Those properties make it unsafe as a real member platform. **Never connect a real database to the demo persona switcher.** The `/live` client uses actual user sessions plus RLS/server-side RPCs and keeps paid and physical-custody functions disabled until they can be operated responsibly.

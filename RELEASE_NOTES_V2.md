# AUNO 2.0 — Release summary

## Delivered in this build

1. **Full appearance system**: light, dark and system modes, persisted preference, early boot application to prevent flash, contrast-aware panels, controls, admin charts, inputs and mobile navigation.
2. **AUNO Now**: intent-led city discovery filtered by mood, available time and free/flexible budget, using clearly labelled curated examples and honest uncertainty.
3. **AUNO Mission Control**: interactive date/category filters; demo booking, seat occupancy, ticket face-value KPIs; event chart; category performance; area mix; social and trust signals; CSV export; and hypothetical revenue/processing economics sliders. Every value is distinguished from real revenue.
4. **Role experiences preserved**: members, organisers, storage partners, admins, journeys, social plans, Moments, XP and moderation remain demonstrable through fictional local data.
5. **PWA shell**: web manifest, icons and a service-worker cache scoped to the public demo files. Offline shell is not a commitment of up-to-date real event information.
6. **Backend consistency**: FastAPI demo bootstrap now exposes role-restricted analytics based on its own persisted SQLite records so the same dashboard works in the local full-stack pilot.
7. **New live-alpha foundation**: Supabase PostgreSQL schema, RLS, grant-limited columns, safe free-event booking/cancel RPCs, operator-controlled approvals, secure opt-in profiles and real email auth client.
8. **Deployment/security guidance**: live-alpha setup, exact security gaps, and public demo vs live environment separation.

## What this is not

- Not yet a fully production-certified marketplace.
- Not deployed to your GitHub repository by this assistant: the connected GitHub access is read-only.
- No live identity verification, payments, WhatsApp Business messaging, regulated storage operation, paid event execution or compliant tourism service is claimed.
- No claims of actual member counts, bookings, payments or revenue from the demo dataset.

## Repository update via Visual Studio

Clone `https://github.com/karansharma07/auno.git`; copy this release's repository contents into the clone **without overwriting `.git`**; inspect the changes; commit as `AUNO 2.0: adaptive UI, Mission Control and Supabase alpha`; push to `main` using the GitHub account with write access. If the existing Pages site is configured to deploy `/docs` from `main`, its new static demo will appear after deployment. If configured for GitHub Actions instead, make sure `.github/workflows/pages.yml` was copied and enable Actions in Settings → Pages. Do not use both sources at once.

## Important production gates

Before real public onboarding: name/trademark review, UAE business licensing, privacy agreements and lawful transfers, MFA for operators, audit and security review, backups and restore drills, content moderation response, venue/host screening, permits and insurance, a payment provider and settlement/refund system. Physical bag storage remains in research/pilot-only status until professional advice and partner contracts are in place.

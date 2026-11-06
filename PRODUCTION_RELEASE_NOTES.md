# AUNO — real-data route foundation (2026-11-06)

## Built and included

- Static route split: public application at `/auno/`, immutable demonstration at `/auno/demo/`.
- Build/deploy workflow for GitHub Actions and a compatible Cloudflare Pages build process.
- Public landing page with professional light/system/dark presentation. No fake records loaded on production route.
- Existing Supabase alpha: real email session, profiles, approved communities, free bookings, owner-created drafts, operator review.
- Live feature suite connected to SQL tables/RPCs: Now, Together, Passport, Concierge, Lens, Homebase, opt-in People introductions and blocking, HostOS, Business enquiries.
- New migration 003: secure connection requests, reciprocal blocking and RLS, homebase tasks, operator check-in and Passport awards, privacy requests, operator report resolution, anonymous published event catalogue, exact aggregated dashboard functions and business enquiry contact email.
- Real-data operator charts and moderation queues; absent data appears as an empty state rather than a fabricated performance graph.
- Forms submit correctly (fix to earlier live alpha), and the community template now parses and renders properly.
- Regression tests, route smoke tests, and published-build checks.

## Blockers to true production launch

1. Repository write access remains unavailable to the connected GitHub account. Release is not pushed or deployed by ChatGPT.
2. No Supabase project URL, public key, test users, live session or provider project access was given. SQL migrations have **not** been applied against a real database; RLS and auth workflows require validation there.
3. Payment gateway, merchant onboarding, financial ledger, refunds, payouts and chargebacks are not implemented.
4. Live venue validation, licensed operations, third-party tours, bag storage custody, insurance and legal approvals are not completed.
5. No production MFA enforcement, penetration test, restore drills, operational support staffing, SLA, privacy-notice approval, or account deletion fulfilment is in place.
6. Automated real WhatsApp Business messaging, live maps/airline integration, real-time chat and verified identity/KYC are not implemented.
7. Long-term commercial deployment must leave GitHub Pages for an appropriate host; GitHub Pages is unsuitable as the paid marketplace production origin under its published terms.

## QA summary

Build and local browser smoke tests pass. Existing simulated demo tests pass. Production backend functionality **has not** been validated against a provisioned Supabase project; do not label the entire system 'production-ready' until the above gates pass.

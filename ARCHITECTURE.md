# AUNO — Technical architecture and evolution

## Working pilot architecture

```text
Browser (responsive HTML/CSS/ES2020 JS)
            |
            | /api JSON + X-Demo-User header (DEMO ONLY)
            v
FastAPI monolith (app.py)
  ├─ personas / profiles / interest preferences
  ├─ experience discovery & reservation service
  ├─ approved community lifecycle
  ├─ host workspace and attendance
  ├─ social connections + Moments + reporting
  ├─ place-based itinerary heuristics
  ├─ luggage reservation + custody state machine
  ├─ XP ledger substitute + demonstration coupons
  └─ admin review and moderation
            |
            v
SQLite database (local persistent seed)
```

This is intentional: one portable, inspectable implementation with no external API keys. It demonstrates workflows, roles and data relationships before infrastructure spend.

## Domain model implemented

| Aggregate | Tables | Key rules |
| --- | --- | --- |
| Identity (demo) | `users` | Persona role selection, preferences and example verification flags |
| Community | `communities`, `community_members`, `community_applications` | Approval queue and membership requests |
| Activities | `events`, `event_bookings` | Capacity checked under SQLite immediate transaction, unique member reservation, cancel/check-in |
| Social | `plans`, `plan_members`, `moments`, `moment_likes`, `connections` | Plan capacity, mutual consent, social content moderation |
| Storage | `storage_partners`, `storage_bookings` | Overlap-aware bag capacity, booking → dropped off → collected |
| Journeys | `journeys` | Deterministic ranked place selection by interests/area/budget/pace; saved samples |
| Recognition | `users.xp`, `rewards`, `redemptions` | XP issued on demo check-in; redemption under transaction; real ledger needed |
| Trust & support | `reports`, `notifications` | Review queue, private persona notifications; audit system not yet available |

API schema is self-documenting at **`/docs`** and OpenAPI JSON at **`/openapi.json`** while the demo server runs.

## Production-target architecture

### Clients
- React Native mobile apps for iOS/Android.
- Next.js responsive member, host, partner and operations web portals.
- Shared design tokens, visual library, input validation rules, localisation and iconography.

### Backend
- Modular monolith first, with bounded contexts (Identity/Trust; Social Graph; Communities; Activities; Reservations; Journeys; Travel Utility; Storage; Rewards; Payments/Finance; Notifications; Operations).
- Type-safe REST / API contract with generated client SDKs, idempotency keys and versioning.
- Managed PostgreSQL, Redis for caching and jobs, object storage for media, encrypted secret storage.
- Event-driven background workers for notifications, settlement, fraud and itinerary recalculation.
- An explicit ledger for money and an independent immutable rewards transaction ledger.
- Workflow engine for approvals, incident cases, refunds and storage custody.

### Permissions
- Replace demo header with OIDC/OAuth, securely stored sessions, refresh-token rotation and MFA.
- Separate principals: Member, Community Organiser, Partner Employee, Internal Operator, System Worker.
- Scope every query and update by tenant, permitted venue/community and operation.
- Use policy-based and object-level authorization; never trust role selection from the browser.
- Require elevated permissions, step-up authentication and audit trails for identity, financial and moderation functions.

### Identity and trust
- Use an appropriate compliant identity-verification vendor with UAE eligibility.
- Minimise retained ID data; store tokenised verification decisions when possible.
- Model **verified identity**, **event attendance**, **community reputation**, and **organiser accreditation** separately.
- Moderation states should include triage, severity, evidence, escalation, appeal and resolution.
- Provide account deletion, consent, data export, location privacy and reporting controls.

### Real-time and community messaging
- First-party chat with consent-aware access, roles and moderation.
- Notification service with push, email, SMS and approved WhatsApp Business message templates as configured.
- Avoid depending on undocumented or unsupported WhatsApp Groups API synchronisation.
- WhatsApp is a user-approved channel, not the authoritative record for bookings, membership or custody.

### AUNO Intelligence
- Build a trusted **place and experience catalog** with source, geocoding, opening hours, venue policies, ticket inventory and freshness timestamps.
- Construct an **availability-aware itinerary optimiser**, respecting constraints (arrival/departure, storage collection, flight buffer, event start times, travel mode, opening windows, budget, accessibility).
- Use routing providers for real-time routes, not geodesic distance guesses.
- Start with retrieval/rules, add LLM natural-language input once constraints and policy evaluation are reliable.
- Explanation: show *why* each stop was recommended, user control, uncertainty and source freshness.
- Privacy: opt-in personalisation, no hidden precise-location exposure, strong consent separation.

### Storage marketplace
- Real capacity inventory by size, location and time slot; concurrency locks; booking expiration and payment capture after inventory hold.
- Partner contracts, due diligence, physical audit, permitted activity checks and liability allocation.
- Unique bag IDs, controlled handoff scan, condition record with consent, tamper evidence and staff identity.
- Custody proof, retrieval PIN/ID protocol, overdue fees, claims, incident case and settlement workflow.
- Per-market routing / permits and transport constraints must be reviewed before luggage delivery.

### Reliability and security
- TLS, WAF, DDoS protections, least-privilege infrastructure, encryption at rest, managed keys and secrets.
- Structured observability, SLOs, alarms, audit event streams, backups, PITR, DR drills.
- CI: unit, integration, contract, accessibility, mobile-device and end-to-end tests.
- Static analysis, dependency scanning, penetration test and independent security assessment before real signups.
- Fraud / abuse prevention (rate limits, referral abuse, event no-shows, coupon farming, chargeback patterns).
- Separate staging vs production environments and feature flags.

## Suggested deployable modules

```text
apps/
  member-mobile/           React Native
  web/                     Next.js member and visitor web
  host-portal/             Community and event operations
  partner-portal/          Venue / storage / service operations
  operations-portal/       Internal Trust & Safety and finance
packages/
  design-system/
  api-client/
  validators/
  types/
services/
  api/                     Modular ASP.NET Core or FastAPI (team decision)
  worker/
  notification-worker/
  itinerary-engine/
infra/
  terraform/
  helm-or-app-service/
```

## Production API family outline

`/auth`, `/identities`, `/members`, `/people`, `/connections`, `/circles`, `/roles`, `/events`, `/bookings`, `/attendance`, `/venues`, `/partners`, `/storage`, `/custody`, `/journeys`, `/places`, `/recommendations`, `/moments`, `/rewards`, `/ledger`, `/notifications`, `/moderation`, `/payments`, `/settlement`, `/admin`, `/reports`, `/analytics`.

Every write should carry actor ID, source client, timestamp, tracing ID and idempotency token when financial or booking-related. Admin actions require auditable decision metadata.

## Separation of facts and mock data

The demo contains generated sample Dubai venues, prices, partners and events. Their existence and operating hours are *not verified*. The itinerary's curated points illustrate recommendation logic but are not live place inventory, mapping directions or travel advice. Do not represent seed data as marketplace availability.

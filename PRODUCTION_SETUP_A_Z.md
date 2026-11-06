# AUNO — Production route + preserved demo: A–Z deployment

**Release type:** deployable real-data application foundation and controlled live alpha. **Not a certification that all regulated commercial modules are ready.** Do not take money or store physical luggage based on this release. No fictional users, venues, bookings or revenue are loaded by the production frontend.

## 1. What the two addresses will serve

- `https://karansharma07.github.io/auno/` — real member frontend, backed by your own Supabase project when configured. Without credentials, a clean public landing page appears; no fake accounts or booking claims.
- `https://karansharma07.github.io/auno/demo/` — preserved AUNO 3.0 demonstration with fictional members and browser-local simulated workflows. It is deliberately isolated from real accounts.

**GitHub policy warning:** GitHub Pages is intended for showcase/static sites, **not as free hosting for a commercial business, transactional marketplace or SaaS**. This release supports a showcase or limited evaluation while you transition the live commercial app to Cloudflare Pages or another suitable host. Do not put credit-card or password collection on GitHub Pages. See https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits.

## 2. Clone, update and push in Visual Studio

1. Open Visual Studio → **Git → Clone Repository** if needed; URL: `https://github.com/karansharma07/auno.git`.
2. Create a backup branch from `main` before replacing an existing installation.
3. Extract `AUNO_Live_Upgrade_Patch.zip`. Copy **the contents** into the cloned repository root, preserving `.git`, including **hidden** `.github/workflows` files and new `demo-static/`, `live/`, `scripts/`, `supabase/`, `docs/` directories.
4. Review changes. Do not commit `.env`, local `live/config.js`, access tokens, service-role keys, card data or personal database exports.
5. Commit with `AUNO live foundations and preserved demo route`; push to `main`.
6. The connected ChatGPT GitHub connection has **read-only** permission, so this push must be performed through your account/Visual Studio unless access changes.

## 3. Create your real shared database

1. Create a fresh **Supabase** project. Select the appropriate region after reviewing UAE personal-data and data-transfer requirements. The free tier is suitable for development/controlled testing, not a guarantee of production reliability.
2. Under **SQL Editor**, review and apply the migration files **in order**:
   - `supabase/migrations/202611060001_foundation.sql`
   - `supabase/migrations/202611060002_experience_suite.sql`
   - `supabase/migrations/202611060003_live_ops.sql`
3. Confirm that `public.profiles`, `public.communities`, `public.events`, `public.event_bookings`, `public.circle_series`, `public.place_recommendations`, `public.member_journeys`, `public.homebase_tasks`, `public.member_connections`, and `public.audit_events` exist.
4. Verify **RLS enabled** for all exposed tables. Policies and narrowly scoped client grants are in the migrations. Never disable RLS to "fix" a permissions error.
5. No seed data are added. The live catalogue is intentionally empty until you approve real organisers/venues and publish real events.

### Identity / email

1. In Supabase **Authentication → Providers**, enable Email and test OTP/magic link delivery.
2. In **Authentication → URL Configuration**, set the Site URL to your actual alpha URL and allow the precise redirect URL `https://karansharma07.github.io/auno/`. For local testing, optionally allow `http://localhost:8080/live/` and `http://127.0.0.1:8080/live/`.
3. Control who can sign up during the alpha. Supabase's basic Email provider may create accounts for new addresses; if the pilot is invitation-only, use the provider's invitation/signup controls. Set up an acceptable privacy notice and operating support before taking real registration details.
4. For real business scale, configure email deliverability/SMTP and abuse controls; do not rely on default free email limits for a public rollout.

## 4. Configure the GitHub Pages frontend

1. In your repository, navigate to **Settings → Secrets and variables → Actions → Variables** (the **Variables** tab, not necessarily Secrets). Create:
   - `SUPABASE_URL`: your exact `https://<project>.supabase.co` URL.
   - `SUPABASE_PUBLISHABLE_KEY`: the Supabase public/publishable (or legacy anon) browser key.
2. These two values are *public browser configuration*, not sensitive server credentials. **NEVER** set the Supabase `service_role` / `sb_secret_` key here or anywhere in browser JS.
3. Under **Settings → Pages → Build and deployment**, set **Source: GitHub Actions**. This is essential because the workflow generates the site and injects the publishable configuration at build time.
4. Open **Actions → Publish AUNO live alpha and preserved demo**, run if necessary, and verify a successful deployment.
5. Test `/auno/` (real frontend) and `/auno/demo/` (preserved demo) in incognito mode. Both links must load. Check the browser console and network tab for missing assets, CSP/CORS, Auth redirect, and Supabase queries.
6. If the old root demo still appears because of a service worker cache, use a private window or clear the old site's cache/service worker. The generated root build includes a one-time worker decommissioner.

### Local preview

```bash
# From repo root, build the two public routes with empty frontend config:
node scripts/build-pages.mjs
python -m http.server 8080 --directory docs
# open http://127.0.0.1:8080/ and /demo/
```

To test against your own Supabase project locally, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the shell when running `node scripts/build-pages.mjs`, or create ignored `live/config.js` and serve `live/` directly. Do not commit server secrets.

## 5. Promote the first *real* operator

1. Sign in through your Supabase-connected AUNO site with your own email.
2. Find your auth user UUID in Supabase **Authentication → Users**. Verify the email account and apply MFA/admin access procedures before granting operational rights.
3. In a trusted Supabase SQL editor (not in the app browser), run:

```sql
insert into public.operator_accounts(user_id)
values ('REPLACE_WITH_ACTUAL_VERIFIED_FOUNDER_AUTH_UUID')
on conflict (user_id) do nothing;
```

4. Sign out and back in. The **Mission Control** tab should appear. No regular member may self-grant operator privileges; the database functions independently validate the operator role.
5. Create a community as a real member; approve it as operator. Create an event draft with verified venue details and publish it only after required permissions. Book the **free** event using a second member and verify both see the same persisted booking.

## 6. Exercise all real-data modules

| Module | End-to-end acceptance test |
|---|---|
| Authentication | Real email link → session → sign-out → sign-in; invalid token rejected |
| Profiles | Preferences persist; member discoverability is OFF by default |
| Communities | Member submits; operator approves; a second user joins |
| Events | Draft → operator publication → free booking → cancellation; capacity cannot be exceeded |
| AUNO Now | Only approved, upcoming database events show; filter by time/category |
| Together | Approved community owner drafts circle; operator publishes; members join/leave |
| Passport | Operator records physical event check-in; stamp appears only in attendee's record |
| Concierge | Save, view and delete own journey from reviewed place recommendations |
| Local Lens | Submit → operator review → publish → another member saves place |
| Homebase | Add, complete and remove own tasks; another member cannot see them |
| People | Member opts in → another requests → receiver accepts; blocking hides mutual discovery |
| HostOS | Approved owner creates template, then uses it to prefill an event draft |
| Business | Submit private partnership request with contact email; operator reviews |
| Admin | Real DB counters, monthly booking chart, review queues, attendance, reports |
| Privacy | Submit an export/deletion request; operator can see queue for human handling |

There is **no live money**, no paid bookings or refunds, no actual luggage inventory/custody, no ID verification vendor, no licensed tourism provider integration, and no automated WhatsApp communication in this release. They remain unavailable by design.

## 7. Security and operating requirements before public onboarding

- **UAE:** Establish company/activity licensing, identity of contracting operator, venue/host agreements, event approvals where applicable, UAE PDPL position, cross-border transfers and review of platform Terms/Privacy Notice by counsel.
- **Supabase:** Test RLS with anonymous user, two distinct members, event owner, and operator; no roles elevated from browser. Verify database backups and restore, monitoring, MFA for operator, abuse/rate limits and alerting. Default free-tier reliability is insufficient for transactional commitments.
- **Social safety:** Staff the reporting queue, define incident SLAs, publish blocking and appeal policies, and prevent minors from mixing with unvetted adult meetups until you have an age/safeguarding model.
- **Financial:** Before charging, integrate a UAE-eligible payment processor with verified merchant account, idempotent payment webhooks, refunds, chargeback management, payouts, accounting, tax and support procedures.
- **Storage:** Obtain legal classification, approved physical partners, insurance, security/CCTV controls, bag handoff verification, claims and incident processes *before* any real luggage reservations.
- **Tourism:** Use properly licensed operators/guides for guided experiences and confirm all event/ticketing permissions.
- **Messaging:** WhatsApp Business automation only after compliant opt-ins, templates and official integration rights; avoid leaking member phone numbers via default public groups.
- **Product:** Finish accessibility and Arabic/RTL testing, privacy data export/deletion fulfillment, automated security tests, real-device QA and performance testing.

## 8. Commercial hosting transition (required before paid marketplace)

Keep GitHub as source control. Connect a **Cloudflare Pages** project to this repo, set build command `node scripts/build-pages.mjs`, output directory `docs`, and configure the same two publishable variables. It serves both app and demo on a suitable host. Set Supabase Auth URLs to the new commercial domain. Keep GitHub Pages as a separate public showcase, not the payment-collecting destination.

## 9. Check before declaring launch-ready

Run:

```bash
node scripts/build-pages.mjs
node scripts/verify-static.mjs
node tests/test_pages_demo.cjs
node tests/test_v2_ui.cjs
node tests/test_live_suite.mjs
# Optional with your live Supabase public variables:
node scripts/verify-supabase.mjs
python -m pip install -r requirements.txt pytest httpx playwright
python -m pytest tests -q
```

These tests exercise build route separation, static demo legacy flows, pure live frontend empty states and local backend behavior. **They cannot certify an unconfigured external Supabase project.** Test migrations, real email provider, the RLS matrix and actual two-account workflows in your own project before allowing real users.

**Rollout recommendation:** Keep `/auno/` invite-only until operational requirements are met; use `/auno/demo/` for investors, partners and public previews. Never treat demonstration metrics or simulated transactions as genuine.

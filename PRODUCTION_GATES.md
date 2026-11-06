# AUNO — Non-negotiable public-launch gates

**Status:** The supplied code is an illustrative local demo, not yet safe or authorised for public deployment. This is a product/security readiness list, not legal advice.

## Gate A — Brand, corporate and operating status

- [ ] Clear provisional name AUNO for UAE and target countries, including Arabic context, trademarks, domains and app stores.
- [ ] Confirm the Dubai corporate legal entity, approved business activities, contractual capacity and tax considerations with qualified advisers.
- [ ] Decide for each vertical whether AUNO is the actual operator, intermediary/marketplace, booking agent or software vendor.
- [ ] Review venue agreements and insurance for sports, community/social events, and professionally hosted experiences.

## Gate B — Dubai events and travel

- [ ] Confirm Dubai Sports Council and DET event permitting responsibilities, venue NOCs, ticketing rules and organisers' obligations for each event type.
- [ ] Partner with appropriate licensed tourism operators and guides for professional guided activities.
- [ ] Establish emergency response, safeguarding, accessibility, photography consent, refund and incident policies.
- [ ] Verify publication, venue, event time, price and cancellation information against authorised sources.

## Gate C — Luggage storage

- [ ] Obtain specialist advice on the applicable Dubai storage, premises, trading, hospitality and tourism licensing framework for professional lockers vs café/restaurant hosts.
- [ ] Check business registration, allowed premises use, landlord/venue permission, fire safety, secure-area access and CCTV implications.
- [ ] Negotiate storage liability, insurance limits, exclusions, claims and compensation responsibility.
- [ ] Establish custody and bag identification processes, security checks, prohibited contents and unattended luggage procedures.
- [ ] Implement concurrency-safe inventory, booking confirmation, partner staff authentication, payment settlement, chargebacks and refund/complaint resolution.
- [ ] Ensure capacity, address and business hours are *real* and currently verified before accepting paid reservations.

## Gate D — Identity, privacy, communication, security

- [ ] Implement real authentication with OIDC/OAuth, server-side authorisation, session security and MFA for privileged roles.
- [ ] Remove `X-Demo-User` persona switching entirely and remove fake verification flags from public claims.
- [ ] Establish UAE privacy compliance, data protection impact assessments where necessary, retention/deletion, cross-border transfers and processor contracts.
- [ ] Vet identity verification providers and minimise retained IDs. Do not store unencrypted ID images in app databases.
- [ ] Implement opt-in member discoverability, approximate rather than precise location, mutual contact permission, blocking and reporting.
- [ ] Formalise Trust & Safety with escalation, audit trail, appeals and 24/7 operating policy where required.
- [ ] Configure WhatsApp Business Platform only under approved account/template/opt-in rules; verify feature/Group API eligibility independently.
- [ ] Perform threat modelling, penetration testing, vulnerability scanning, backups and recovery tests.

## Gate E — Money and rewards

- [ ] Use an approved payment service provider; do not store card data.
- [ ] Establish double-entry accounting, financial reporting, payout reconciliation, refunds and disputes.
- [ ] Review loyalty rewards classification with UAE counsel for the exact points mechanics and redemption arrangements.
- [ ] Keep initial reward points non-cash, non-transferable and closed-loop as designed; do not imply they have trading value.
- [ ] Do not release crypto tokens, exchange features, external wallets, speculative token economics or transferable digital assets without specialist legal analysis under the applicable UAE/VARA framework.

## Gate F — Delivery quality

- [ ] Mobile app / web keyboard and screen-reader audit; Arabic RTL and localisation plan.
- [ ] End-to-end tests for member signup, booking, cancellation, refund, no-show and support.
- [ ] Load and capacity tests, SLOs, logging, production dashboards and incident response.
- [ ] Pilot consented beta, with measurable event attendance, repeat participation, host quality and safety resolution.
- [ ] Obtain verified partners and approved inventory before public offer claims.

## Explicit demo limitations

| Capability | Demo | Public-launch need |
| --- | --- | --- |
| User authentication | Header persona switch | Real identity and role-based access |
| KYC | Fictional seed field | Approved provider with consent and retention controls |
| Money | Display-only AED | Licensed PSP, disputes, settlement, refunds |
| Events | Fictional activities | Venue/organiser contracts, permits as applicable |
| Bag storage | Fake listings, simulated handoff | Legal storage arrangement, insurances and physical process |
| AI journeys | Curated deterministic ranking | Verified place data, routing, time constraints and provider availability |
| WhatsApp | Share deep links | Approved Business API messaging with opt-in |
| Security | Local demonstration | Full app security programme |

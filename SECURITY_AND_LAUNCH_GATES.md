# Security and go-live gates

| Control | Status in source | Must happen before public real users |
|---|---|---|
| Demo/live isolation | Built | Publish both paths and verify old service worker cleared |
| Auth session | Supabase code | Configure Auth project, email links, rate controls, MFA for operators |
| Sensitive data permissions | RLS migrations written | Execute adversarial two-account and anonymous tests on real DB |
| Event capacity | Row-locking server RPC written | Test concurrent reservations in the provisioned Postgres project |
| Member consent + blocking | Server functions and RLS written | Abuse testing, real member feedback, incident escalation |
| Moderation | Report submission, private queue, operator resolution | Staff, appeals, emergency escalation, audit/retention policies |
| Privacy | Request table and data minimisation | Reviewed privacy notice, response SLA, export and deletion fulfilment |
| Backups | Not provisioned | Schedule backups and verify an actual restore |
| Logging / alerts | Basic DB audit events | Production exception monitoring, security alerts and alert ownership |
| Venue / events | Draft and approvals | Licensed operators/venues, contracts and applicable permits |
| Payments | Disabled | Merchant account, PSP, 3DS, webhook verification, refunds, ledger, reconciliations |
| Luggage custody | Disabled | License/activity determination, partner vetting, insurance, prohibited item checks |
| AI concierge / routing | User-saved real place catalogue only | Licensed and validated map/route/opening-hour sources; truthfulness checks |
| WhatsApp business | Disabled | Verified API account, opt-ins, templates and compliant retention |
| Accessibility | Responsive themes built | Screen-reader, keyboard, low vision, RTL, reduced motion on devices |
| Operations | Operator dashboard and checks | Written support runbooks, trained operator, refund/safety escalation |
| Branding | Working name | Clearance for AUNO name, trademark, Arabic and domain checks |

**No-red-flags launch principle:** keep public site browse/showcase only until the operator completes the data, legal, security, safety and payment go-live gates. Invite-only alpha may be possible sooner under proper notices, vetted events and risk controls.

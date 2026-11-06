# AUNO → GitHub and GitHub Pages

## What is in this repository?

- `/` — FastAPI + SQLite local full-stack pilot source and the product blueprint. **Do not expose this backend publicly without real authentication, data protection, permissions, rate limits, audit logs, and operational/legal reviews.** Its `X-Demo-User` header is intentionally insecure.
- `/docs/` — standalone **static GitHub Pages demo** of the same AUNO interface, with a browser-local simulated API. It runs without Python, a database, backend hosting, API keys, or paid services.
- `/.github/workflows/pages.yml` — GitHub Actions workflow deploying `/docs/` to GitHub Pages.

The public demo is fiction-only. Data lives in each visitor's browser localStorage and is **not shared across devices or visitors**. Verification, payments, luggage storage, bookings, chats, and rewards are simulated. Do not enter sensitive information or treat demo reservations as real. WhatsApp only opens user-initiated sharing.

## Publish to `karansharma07/auno`

1. Ensure the GitHub account/repo access used to push has write access to `karansharma07/auno`.
2. Add the project contents at the **repository root** (not nested under an extra `auno-platform` folder), preserving `.github/workflows/pages.yml` and `docs/`.
3. Commit and push to the repository's default branch (`main`, or adjust the workflow trigger to the default branch if different).
4. The GitHub repo should be public if you want the repository itself to be publicly browsable. Confirm GitHub Pages availability for its visibility/plan.
5. Open **Repository → Settings → Pages → Build and deployment** and set **Source: GitHub Actions**.
6. Open **Actions → Publish AUNO browser demo to GitHub Pages** and run the workflow manually if a push did not trigger it. Wait for a successful deployment run and copy its verified `page_url`.
7. Expected URL convention for a repo named `auno` under `karansharma07`: `https://karansharma07.github.io/auno/`. **This is only a prediction until Pages reports a successful deployment and the live link is checked.**

If deploying by branch/folder instead of Actions, choose the default branch and `/docs` in Settings → Pages. You then do not need the workflow; choose one Pages deployment source rather than running both.

## Local preview of the Pages site

```bash
cd docs
python3 -m http.server 8080
# Open http://127.0.0.1:8080/
```

The Pages demo must be served over HTTP (not opened from a `file://` URL), because it fetches `seed.json`.

## Quick checks

Open the Pages site and verify:

- Layout and original SVG artwork render at the `/auno/` project subpath.
- Switch between resident/visitor and Maya/Omar/Leila/AUNO Operations fictional personas.
- Book an activity, then switch to Omar to check in the member and award demo XP.
- Create a community as Maya, approve it as Operations, and verify it appears in Communities.
- Reserve fictional luggage at a sample venue, switch to Leila, record simulated drop-off and collection.
- Generate an itinerary and verify the suggested items show in Journeys.

For troubleshooting a failed GitHub Actions run, inspect **Actions → Publish AUNO browser demo → failed job → logs**. For `Get Pages site failed` or `Resource not accessible by integration`, verify Pages is enabled and set to GitHub Actions and that Actions has permission to deploy Pages.

## Production hosting plan

GitHub Pages supports static HTML/CSS/JS, **not Python/FastAPI, SQLite persistence, or real multiuser APIs**. Eventually host a secured API and database separately (and switch the frontend to real authentication), while keeping marketing/docs static if desired.

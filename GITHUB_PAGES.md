# AUNO GitHub Pages — current dual-route architecture

This repository now builds two sites into one artifact:

- `https://karansharma07.github.io/auno/` — non-simulated live frontend, with an optional Supabase connection. Until the database is configured, the route displays the branded early-access homepage rather than fabricated records.
- `https://karansharma07.github.io/auno/demo/` — the preserved original v3 static demonstration.

**Do not select “Deploy from a branch” for the recommended flow.** Use **Settings → Pages → Source: GitHub Actions**. The workflow `.github/workflows/pages.yml` checks out the repo, runs `node scripts/build-pages.mjs`, tests the route split, publishes generated `docs/`, and deploys it.

In **Settings → Secrets and variables → Actions → Variables**, create `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` with your own Supabase project URL and **public publishable/anon** key. These values are browser-visible. Never upload service-role/secret keys, passwords, private auth tokens or payment provider server keys. Apply migrations 001–003 in Supabase first and configure the Auth redirect URL to the exact live site.

See [PRODUCTION_SETUP_A_Z.md](PRODUCTION_SETUP_A_Z.md) for the full checklist, operator setup, and launch gates.

**Policy limitation:** GitHub Pages is a project showcase/static hosting feature, not allowed as the free host of a commercial marketplace or SaaS. Before paid services, move the real application to an appropriate commercial host; keep Pages as a demo/showcase if desired. https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

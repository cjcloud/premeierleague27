# premierLeague27 — Deployment Runbook (2026/27 season)

This project is the 2026/27 rebuild of the Premier League prediction app. All code changes
are already applied. The steps below are the parts that need **your** accounts (GitHub, Neon,
Vercel) and can't be done from the build sandbox. Do them in order.

Season kicks off **Saturday 22 August 2026** (opening fixture Fri 21 Aug, 20:00 BST) — predictions
lock at that kickoff, so aim to be live a few days before.

---

## 0. What's already done (in this codebase)

- Data source repointed to season `2026` (== "Season 2026/2027"), centralised as `SEASON_ID` in `src/lib/api.ts`.
- Emerald & Teal theme (was slate) — `src/app/globals.css`, `tailwind.config.ts`, header, homepage.
- Prediction deadline set to Fri 21 Aug 2026 20:00 BST — `src/lib/time-utils.ts` (confirm the exact opener, see step 6).
- Staleness window set to 3 minutes (spec) — was 5.
- Seed bug fixed (`entry.overall.position`, integer `apiId`).
- All season copy updated to 2026/27 (README, spec, page metadata, tests).
- Security: removed hardcoded DB credentials from `next.config.mjs` and `src/db/index.ts`;
  `.env` now gitignored; fresh `SECRET_COOKIE_PASSWORD` and `CRON_SECRET` generated (in `.env.local`).
- Fresh access codes for the four users (`Specifications/codes.md`, gitignored).
- Verified: `tsc --noEmit` passes and `next build` compiles all routes.

`.env.local` and `Specifications/codes.md` are included in this folder but are **gitignored** —
they will NOT be pushed to GitHub. Keep them; you need them for local dev and for the Vercel env vars.

---

## 1. Create the new GitHub repo

```bash
cd premierLeague27
git init
git add .
git commit -m "Premier League 2026/27 prediction app"
git branch -M main
# create an EMPTY repo named premierLeague27 on GitHub first, then:
git remote add origin https://github.com/cjcloud/premierLeague27.git
git push -u origin main
```

Confirm after pushing that `.env.local` and `Specifications/codes.md` did **not** get committed
(`git ls-files | grep -E "env.local|codes.md"` should print nothing).

## 2. Rotate last season's leaked credential (do this regardless)

The old `premierLeague26` repo has a live Neon connection string committed in its history
(`.env`, `next.config.mjs`, `src/db/index.ts`). In the Neon console for that old project,
**reset the password / rotate the credential** so the exposed string no longer works.

## 3. Create the new Neon database (2026/27)

- In the Neon console, create a **new project** (or a new database) for 2026/27 — separate from
  last season. Free tier is fine.
- Copy its connection string (the pooled `...-pooler...` URL with `sslmode=require`).
- Paste it into `.env.local` as `DATABASE_URL`, replacing the placeholder.

## 4. Create the schema and seed the data (run locally)

```bash
npm install
npm run db:push     # creates users / teams / predictions tables
npm run db:seed     # inserts the 4 users + pulls the 20 teams from the 2026 PL API
```

If `db:seed` fails to fetch teams (the PL API sometimes hasn't published the new season's
standings table until closer to kickoff), you can seed the 20 promoted/continuing teams manually
and let positions fill in once the API goes live. See step 6.

## 5. Verify the scraping method (the key acceptance check)

From your machine (this is what couldn't run in the sandbox — the PL API domain is proxy-blocked there):

```bash
npm run test:api:simple      # expect HTTP 200 + 20 teams from seasons/2026
npm run test:update-logic    # exercises the 3-minute refresh path against your new DB
npm run dev                  # then smoke-test in the browser (below)
```

Browser smoke test at http://localhost:3000:
- Log in with an access code from `Specifications/codes.md`, submit all 20 predictions
  (no duplicate positions), confirm it saves and is editable **before** the deadline.
- Open the leaderboard: standings load, proximity colour-coding (green/amber/red) renders on the
  new theme, and per-user point totals compute per the spec.
- Confirm the app looks clearly different from last season (emerald/teal, not slate).

## 6. Confirm the prediction deadline

`src/lib/time-utils.ts` → `PREDICTIONS_DEADLINE` is set to `2026-08-21T20:00:00+01:00`
(Arsenal v Coventry City, Fri 21 Aug 2026, 20:00 BST — the reported opener). **Double-check the
exact first-match kickoff** on the official fixtures and adjust this one line if needed, then commit.

## 7. Deploy to Vercel

- Go to https://vercel.com/new and import the `premierLeague27` repo (framework auto-detected: Next.js).
- In the project's **Environment Variables**, add (from your `.env.local`):
  - `DATABASE_URL` — the new Neon URL
  - `SECRET_COOKIE_PASSWORD`
  - `CRON_SECRET`
- Deploy. Test the preview URL with the same smoke test as step 5, then promote to production.
- Optional: add a Vercel Cron hitting `GET /api/cron/update-standings` with header
  `Authorization: Bearer <CRON_SECRET>` so standings refresh even when no one is viewing the leaderboard.
  (The in-app 3-minute lazy refresh already covers normal use, so this is optional.)

## 8. Go-live checklist

- [ ] Old Neon credential rotated (step 2)
- [ ] New DB seeded with 20 teams + 4 users
- [ ] `test:api:simple` returns the 2026/27 teams
- [ ] Deadline confirmed against final fixtures
- [ ] Access codes distributed privately to Clive, John, Dingle, Chris
- [ ] Production deploy smoke-tested before Fri 21 Aug 2026, 20:00 BST

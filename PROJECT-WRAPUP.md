# Premier League Predictions 2026/27 — Project Wrap-Up

**Status: Complete and deployed.** This document closes out the 2026/27 build so the project can be picked up quickly next season (or if changes are needed mid-season) without having to re-derive decisions from scratch.

---

## 1. What this app does

A prediction game for a small private group. Each user logs in with a personal access code (no passwords/accounts), predicts the final league position of all 20 Premier League teams for 2026/27, and the leaderboard scores everyone against the live table as the season progresses — colour-coded by accuracy, with bonus points for the title, top 4, and relegation zone.

## 2. Where it lives

| | |
|---|---|
| Code | `github.com/cjcloud/premeierleague27` *(note: repo name keeps the original "premeier" typo — only the Vercel project/domain were corrected, see §7)* |
| Hosting | Vercel |
| Database | Neon (serverless Postgres), a fresh instance created for 2026/27, separate from last season's |
| Local project folder | `C:\Users\CJ\OneDrive\projects\premierLeague27` |

## 3. Stack

- Next.js 14.2.5 (App Router) + TypeScript
- TailwindCSS + shadcn/Radix UI components
- Drizzle ORM → Neon Postgres
- iron-session for cookie-based auth (access code in, no passwords)
- Deployed to Vercel (server actions, iron-session and API routes need its Node runtime — this is why the app can't run on something static like GitHub Pages)

## 4. Season-specific configuration

Two single-source-of-truth constants control which season the app runs — carrying this forward to 2027/28 means changing these two values and standing up a fresh database, nothing else:

- `SEASON_ID` in `src/lib/api.ts` — currently `'2026'`, which the Premier League's API treats as "Season 2026/2027".
- `PREDICTIONS_DEADLINE` in `src/lib/time-utils.ts` — currently `2026-08-21T20:00:00+01:00` (kickoff of the opening fixture, Arsenal v Coventry City). Both the home page and the predictions page render this dynamically via `getFormattedDeadline()`, so there's only one date to update, not several hardcoded strings scattered through the UI.

## 5. Data source (the API scraping)

Standings come from the Premier League's own internal API (not a public/documented one):
```
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false
```
It requires browser-mimicking headers (`Origin`, `Referer`, `User-Agent`) to avoid a 403. This was verified live and working for 2026/27 (confirmed all 20 teams, including newly-promoted Coventry City, returned correctly).

The leaderboard checks the age of the stored standings on every view; if older than **3 minutes**, it re-fetches from the API automatically. This keeps the data reasonably fresh without hammering the API. There's also an optional cron endpoint (`/api/cron/update-standings`, protected by `CRON_SECRET`) if you want standings to refresh even when nobody's looking at the leaderboard — not currently wired up to a Vercel Cron job, but the route exists if you want it.

## 6. User management

Handled entirely through the app itself — no direct database editing needed:

- Log in as an admin, go to **Admin**.
- **Add / Edit / Delete** users, each with a name, an access code (type your own or click **Generate**), and an admin toggle.
- Built-in protections: can't delete yourself, can't delete or demote the last remaining admin, access codes must be unique and at least 6 characters.
- User changes (add/edit/delete) immediately revalidate both the admin list and the leaderboard — no stale-cache lag.

**Known access codes** (from `Specifications/codes.md`, gitignored — not in git history):

| User | Role | Code |
|---|---|---|
| Clive | user | `Cv7&kRm2` |
| John | user | `Jn4!tPw9` |
| Dingle | user | `Dg2#xQs6` |
| Chris | admin | `Ch9$zNb3` |

Simon, Ian, and any others added later via the Admin panel directly aren't recorded in that file (they were added outside this working session) — worth adding them to `Specifications/codes.md` yourself for your own records, same format as above, so they're not only recoverable via the live database.

## 7. Design / theme

The app uses a **Forest** theme — deep green, club red, and cream — derived by pixel-sampling an actual Nottingham Forest adidas shirt photo, per your request. It's implemented as CSS custom properties in `src/app/globals.css` (light and dark variants), consumed throughout via Tailwind's `bg-primary`, `text-destructive`, `bg-secondary` etc. rather than hardcoded colours, so re-theming again in future only means editing that one file plus the safelist in `tailwind.config.ts`.

The app icon/favicon (browser tab, homescreen/PWA icon, Apple touch icon) was regenerated from `public/Premier League Square.svg` — the same badge used in the header — so the logo is now consistent everywhere rather than a leftover default.

**Naming note:** the GitHub repo is still `premeierleague27` (typo preserved intentionally, matching what you created). The **Vercel project and domain** were renamed mid-project to the corrected `premierleague27` — worth double-checking that finished cleanly (old `.vercel.app` domain removed, new one live) since Vercel's own docs don't guarantee the old URL keeps resolving after a rename.

## 8. Mobile / responsive work

The leaderboard table (the hardest layout problem here — up to 13 columns for 5+ users) now adapts by device orientation:

- **Portrait:** a narrower table. Below 480px wide, the Pos column drops entirely and each user shows only their predicted position (colour still conveys the point value — see the legend above the table). At 480px and up, Pos comes back. User name headers render vertically rather than truncating with an ellipsis, so full names stay readable without forcing columns wider than the numeric data needs.
- **Landscape:** the full table — Pos, Team, Prem Pts, and both Predicted/Points columns per user.

This was implemented as genuinely separate `<table>` markup per variant (not CSS-hidden cells within one table) — hiding cells with `display:none` doesn't reliably let `table-auto` layout give the freed width back to other columns, which caused a few rounds of "why is there still whitespace" before landing on this approach.

Several other pages had a recurring bug worth knowing about if you add new pages: Tailwind's `container` utility bakes in a fixed 2rem (32px) left/right padding at *every* screen size unless something else overrides it. This bit the header, the home page, the admin panel, the predictions page, and the login page at various points — the fix everywhere was swapping `container` for explicit responsive padding (`px-2 sm:px-4` etc.). If a future page looks oddly cramped or indented on a phone, this is the first thing to check.

## 9. Notable bugs fixed this build (in case anything regresses)

- **Middleware wrongly restricted `/predictions` to admins only** — regular users (Clive, John, Dingle) got silently bounced to home when trying to make predictions. Fixed to check login status only, not admin status.
- **Logged-out users clicking "Make Predictions" were redirected back to home instead of to login** — looked completely inert since they were usually already on the home page. Fixed to redirect to `/login`.
- **Seed script bug**: `actualPosition` was read from the wrong field in the API response (`entry.position` instead of `entry.overall.position`), and `apiId` wasn't being parsed to an integer. Both fixed.
- **Leaderboard not showing newly-added users** — an admin-panel caching gap; user mutations now revalidate the leaderboard path, not just the admin path.
- **Hardcoded DB credentials** were removed from `next.config.mjs` and `src/db/index.ts` (the old 2025/26 repo has a leaked Neon credential in its git history — that old credential should be rotated in Neon if it hasn't been already, since rotating it doesn't touch this season's separate database).

## 10. Local development

```bash
npm install
npm run dev              # http://localhost:3000
npm run db:push          # push schema changes
npm run db:seed          # reset + reseed users and pull teams from the live API
npm run test:api:simple  # verify the PL API scrape still works
npm run build             # production build check
```

Environment variables (`.env.local`, gitignored): `DATABASE_URL`, `SECRET_COOKIE_PASSWORD`, `CRON_SECRET` — same three are set in Vercel's project settings for production. Vercel's dashboard always shows the edit field for a saved env var as empty (this is normal, not data loss) — avoid re-saving an apparently-empty field, and prefer delete-and-recreate or the `vercel env` CLI if you need to verify a value.

## 11. Suggested pre-kickoff checklist

- [ ] Confirm the Vercel domain rename (`premierleague27.vercel.app`) fully took effect and the old typo'd URL is removed or redirects.
- [ ] Rotate the leaked Neon credential in the old `premierLeague26` repo's git history (separate database, but still worth closing).
- [ ] Set the `premeierleague27` GitHub repo to Private if it's still Public.
- [ ] Add Simon, Ian (and anyone else added outside this session) to `Specifications/codes.md` for your own records.
- [ ] Distribute access codes to all users privately before kickoff (Fri 21 Aug 2026, 20:00 BST).
- [ ] Optional: wire `/api/cron/update-standings` to a Vercel Cron job if you want standings refreshing without anyone viewing the leaderboard.

---

*Built and maintained across this Claude session — for the full blow-by-blow of every change and why, the git commit history on `main` has one commit per fix/feature with a descriptive message.*

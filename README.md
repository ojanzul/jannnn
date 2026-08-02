# AURORA Dashboard (Vercel)

Read-only view of the signals, AI model status, and trade journal produced
by the Supabase backend (`aurora-backend/`). Does not run any cron jobs
itself — see `aurora-backend/README.md` for that.

## Pages

- `/` — latest signal per instrument + recent BUY/SELL history
- `/models` — AI model trust status, weights, expectancy per instrument
- `/journal` — add/view manual trade journal entries

## Deploy to Vercel

1. Push this folder to a GitHub repo (or the same repo as `aurora-backend/`,
   just point Vercel's "Root Directory" setting at `aurora-dashboard/`).
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Add environment variables (Project Settings → Environment Variables):

   | Name | Value | Exposed to browser? |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co` | Yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase Project Settings → API | Yes (protected by RLS) |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase Project Settings → API | **No — server-only** |

   The service role key is only read inside `app/api/journal/route.ts` and
   `app/journal/page.tsx` (both server-side). Never add a `NEXT_PUBLIC_`
   prefix to it — that would ship it to every visitor's browser.

4. Deploy. No cron configuration needed here — Vercel's cron limits don't
   matter for this project since nothing here is scheduled.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your real values
npm run dev
```

## Notes

- `/` and `/models` are cached for 30–60s (`export const revalidate`) since
  they're read-only views of data that only changes every 5–60 minutes
  anyway — no need to hit Supabase on every page load.
- `/journal` is always fresh (`revalidate = 0`) since it's a personal log
  you're actively adding to.
- This dashboard has no login. If you deploy it publicly and don't want
  strangers viewing your signals/journal, put it behind Vercel's
  password protection (Pro plan) or restrict `journal_entries`/
  `backtest_trades`/`scan_log` further — they currently have no public
  RLS policy, so the anon key can't read them at all; only your own
  server-side API routes (using the service key) can.

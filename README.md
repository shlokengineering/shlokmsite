# Insurance Survey Management

Web app for managing the lifecycle of motor insurance survey cases in Nepal: case
registration, surveyor deputation, visits, status tracking, report submission, and payment
status.

See [claude.md](./claude.md) for the full product/technical spec this app was built from, and
[database.md](./database.md) for the original schema notes.

## Stack

- React + TypeScript (Vite)
- Tailwind CSS v4
- React Router (`HashRouter`, so it works on static GitHub Pages hosting)
- Supabase (Postgres, Auth, Storage, Row Level Security)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

### Supabase project setup

1. Create a project at [supabase.com](https://supabase.com) (or run one locally with the
   Supabase CLI: `supabase start`).
2. Apply the schema: `supabase db push` (remote) or `supabase db reset` (local), which runs
   everything in `supabase/migrations/`.
3. Copy the project URL and anon key into `.env.local`.
4. Create your first admin: go to `/signup` in the running app and create an account (this
   creates a Supabase Auth user and, via a DB trigger, a `profiles` row with role `surveyor`
   by default). Confirm the email if your project has email confirmation enabled, then run:
   ```sql
   update profiles set role = 'admin' where id = '<the-user-uuid>';
   ```
   Find the uuid in Supabase dashboard → Authentication → Users, or `select id from auth.users;`.
5. Regenerate types after any schema change:
   ```bash
   supabase gen types typescript --project-id <id> > src/types/database.ts
   ```

## Commands

```bash
npm run dev        # start local dev server
npm run build      # type-check (tsc -b) and production build
npm run lint       # oxlint
npm run preview    # preview the production build locally
```

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys `main` to GitHub Pages automatically.

1. In the repo settings, set **Pages → Source** to "GitHub Actions".
2. Add repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Confirm `base` in [vite.config.ts](./vite.config.ts) matches your repo name
   (`/<repo-name>/`), or use a custom domain and set `base: '/'`.
4. Add the deployed URL to Supabase Auth → URL Configuration → Site URL / Redirect URLs.

## Project structure

```
src/
  constants/insurers.ts   # insurer autocomplete suggestions
  lib/supabase.ts         # single Supabase client
  types/database.ts       # hand-written now; regenerate from Supabase once a project exists
  types/domain.ts          # camelCase domain types used by the UI
  components/             # shared UI (Layout, ProtectedRoute, InsurerAutocomplete, ...)
  features/
    auth/                  # login, auth context
    cases/                 # case list/detail/form
    visits/                # add visit
    statuses/              # status timeline + update form
    reports/                # draft/submit report
    payments/               # admin payment tracking
    admin/                  # manage surveyor roles
  pages/About.tsx           # public company page (no auth required)
supabase/
  migrations/               # schema + RLS + triggers
  seed.sql
```

## Decisions made while scaffolding (please confirm)

`claude.md` flagged a few schema questions before building. Defaults chosen so the app is
functional; revisit these with the team:

- **`payments.case_id`**: added (payments has a 1:1 unique FK to `cases`). Without it there was
  no way to know what a payment was for.
- **Surveyor assignment**: modeled as `cases.assigned_surveyor_id` (not a separate
  `case_assignments` table) — simpler RLS, one surveyor per case at a time. Re-assigning
  overwrites the previous value; history of past assignees is only visible via the `statuses`
  timeline (a `deputed` entry is recorded on each assignment).
- **Payments visibility**: admin-only for both read and write. Surveyors currently cannot see
  payment status for their cases.
- **`visits` / `statuses` numbering**: `visit_no` / `status_no` are assigned server-side by a
  trigger (`max + 1` per case), not sent by the client. `statuses` rows cannot be updated or
  deleted (enforced by a DB trigger), per the append-only rule.
- **New surveyor accounts**: surveyors self-register at `/signup` (Supabase Auth `signUp` with
  the public anon key — no service role needed). A DB trigger auto-creates their `profiles` row
  with role `surveyor`. Admins can then promote/demote any existing profile's role from the
  **Surveyors** admin page. There's still no way to *invite* someone by email or create an
  account on their behalf from the app — that would require the Supabase Admin API
  (service role key) in an Edge Function, which doesn't exist yet.
- **Nepali (BS) dates**: not implemented; all dates are Gregorian (`date` columns) for now.
- **Report format**: a simple versioned free-text draft/final flow (`reports` table), not a
  structured PDF/insurer-specific template.

## Still open (see `claude.md` TODOs)

Company details for the About page, notifications, custom domain, and the final list of
lifecycle stages are placeholders — update `src/pages/About.tsx`, the `STATUS_STAGES` array in
`src/types/domain.ts`, and the matching `stage` CHECK constraint in
`supabase/migrations/20260930120000_init.sql` together if these change.

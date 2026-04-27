# MacroTracker

React + Vite + TypeScript app for tracking daily macros.

## Run locally

1. Install dependencies:
   - `npm install`
2. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Start dev server:
   - `npm run dev`

## Supabase schema (today-only daily log)

Run this SQL in your Supabase SQL editor:

```sql
create table if not exists public.daily_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null default current_date,
  food_id text not null,
  food_name text not null,
  weight_grams numeric not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_log_entries_user_date_idx
  on public.daily_log_entries (user_id, logged_on);
```

## Row level security (RLS)

```sql
alter table public.daily_log_entries enable row level security;

create policy "select_own_daily_logs"
on public.daily_log_entries
for select
using (auth.uid() = user_id);

create policy "insert_own_daily_logs"
on public.daily_log_entries
for insert
with check (auth.uid() = user_id);

create policy "delete_own_daily_logs"
on public.daily_log_entries
for delete
using (auth.uid() = user_id);
```

## Auth

The app uses Supabase email/password auth:
- Sign up with email/password.
- Sign in to load and save today’s entries.

-- FINOVA database schema for Supabase (PostgreSQL) with Row Level Security.
-- Every table is owned by a user (auth.users). RLS policies ensure each signed-in user can only
-- read and write their own rows. Run this in the Supabase SQL editor.
-- FINOVA is a tracker and learning platform: these tables never store bank passwords, UPI PINs,
-- card numbers, OTPs or any credentials.

create extension if not exists "pgcrypto";

-- ---------- Profiles & preferences ----------
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  theme        text not null default 'dark' check (theme in ('dark','light')),
  xp           integer not null default 0 check (xp >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.planning_preferences (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  risk_tolerance   text not null default 'medium' check (risk_tolerance in ('low','medium','high')),
  horizon_years    smallint not null default 5 check (horizon_years between 1 and 50),
  income_stable    boolean not null default true,
  dependents       smallint not null default 0 check (dependents between 0 and 20),
  ai_uses_wallet   boolean not null default false,   -- explicit consent for AI to use wallet summary
  ai_remembers     boolean not null default false,   -- explicit consent to store AI conversations
  notify           jsonb not null default '{"enabled":false}'::jsonb,
  updated_at       timestamptz not null default now()
);

-- ---------- Wallet ----------
create table if not exists public.income_records (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  source     text not null check (source in ('Salary','Freelancing','Business','Other','Additional')),
  amount     numeric(14,2) not null check (amount >= 0),
  received_on date not null,
  recurring  boolean not null default false,
  note       text check (char_length(note) <= 120),
  created_at timestamptz not null default now()
);

create table if not exists public.expense_records (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  category   text not null check (category in ('Food','Shopping','Education','Transportation','Rent','Entertainment','Bills','Healthcare','Other')),
  amount     numeric(14,2) not null check (amount >= 0),
  spent_on   date not null,
  recurring  boolean not null default false,
  note       text check (char_length(note) <= 120),
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_budgets (
  user_id  uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount   numeric(14,2) not null check (amount >= 0),
  primary key (user_id, category)
);

create table if not exists public.savings_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) <= 60),
  kind        text not null check (kind in ('emergency','savings','purchase','education','business','investment')),
  target      numeric(14,2) not null check (target > 0),
  saved       numeric(14,2) not null default 0 check (saved >= 0),
  deadline    date not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  goal_id     uuid not null references public.savings_goals(id) on delete cascade,
  amount      numeric(14,2) not null,
  made_on     date not null
);

create table if not exists public.debts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  outstanding numeric(14,2) not null check (outstanding >= 0),
  emi         numeric(14,2) not null check (emi >= 0),
  rate_pct    numeric(5,2) not null check (rate_pct >= 0)
);

create table if not exists public.planned_investments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  amount       numeric(14,2) not null check (amount > 0),
  day_of_month smallint not null check (day_of_month between 1 and 28),
  active       boolean not null default true
);

-- ---------- Investing (paper trading + manual tracking) ----------
create table if not exists public.investment_records (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  account    text not null check (account in ('paper','manual')),
  kind       text not null check (kind in ('stock','fund')),
  symbol     text not null,          -- NSE symbol (e.g. INFY.NS) or AMFI scheme code
  name       text not null,
  qty        numeric(18,6) not null check (qty > 0),
  avg_price  numeric(14,4) not null check (avg_price > 0),
  category   text,
  created_at timestamptz not null default now()
);

create table if not exists public.paper_orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('stock','fund')),
  symbol      text not null,
  side        text not null check (side in ('BUY','SELL')),
  order_type  text not null check (order_type in ('MARKET','LIMIT','SIP','LUMPSUM')),
  qty         numeric(18,6) not null,
  price       numeric(14,4) not null,
  limit_price numeric(14,4),
  status      text not null check (status in ('EXECUTED','OPEN','CANCELLED','REJECTED')),
  placed_at   timestamptz not null default now(),
  executed_at timestamptz
);

create table if not exists public.watchlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) <= 40),
  symbols    text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Learning & AI ----------
create table if not exists public.learning_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    text not null,
  completed_at timestamptz,
  quiz_score   smallint,
  quiz_total   smallint,
  primary key (user_id, lesson_id)
);

create table if not exists public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  mode       text not null check (mode in ('learning','research','planner')),
  role       text not null check (role in ('user','assistant')),
  content    text not null check (char_length(content) <= 8000),
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists income_user_date   on public.income_records (user_id, received_on desc);
create index if not exists expense_user_date  on public.expense_records (user_id, spent_on desc);
create index if not exists orders_user_time   on public.paper_orders (user_id, placed_at desc);
create index if not exists ai_user_time       on public.ai_conversations (user_id, created_at desc);

-- ---------- Row Level Security: owner-only access on every table ----------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','planning_preferences','income_records','expense_records','monthly_budgets','savings_goals',
    'goal_contributions','debts','planned_investments','investment_records','paper_orders','watchlists',
    'learning_progress','ai_conversations'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists "%s_select_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_own" on public.%I', t, t);
    execute format('create policy "%s_select_own" on public.%I for select to authenticated using (user_id = auth.uid())', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert to authenticated with check (user_id = auth.uid())', t, t);
    execute format('create policy "%s_update_own" on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete to authenticated using (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- Goal contributions must belong to one of the user's own goals.
drop policy if exists "goal_contributions_insert_own" on public.goal_contributions;
create policy "goal_contributions_insert_own" on public.goal_contributions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.savings_goals g where g.id = goal_id and g.user_id = auth.uid()));

-- Anonymous users get no access at all.
revoke all on all tables in schema public from anon;

-- ============================================================================
-- Memberships & billing (mirrors server/account; for a future move to Supabase)
-- Members may READ their own rows. Only the server (service role) may write,
-- after verifying payments with Razorpay / Google Play. No INSERT/UPDATE/DELETE
-- policies exist for authenticated users, so the browser can never grant itself a plan.
-- ============================================================================
create table if not exists public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  plan                 text not null check (plan in ('free','pro','elite')),
  status               text not null check (status in ('active','trialing','past_due','canceled','expired')),
  provider             text not null check (provider in ('razorpay','google_play','test')),
  provider_ref         text,
  test                 boolean not null default false,
  current_period_start timestamptz not null,
  current_period_end   timestamptz not null,
  cancel_at_period_end boolean not null default false,
  scheduled_plan       text check (scheduled_plan in ('free','pro','elite')),
  started_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.billing_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  plan         text not null,
  amount_paise integer not null check (amount_paise >= 0),
  currency     text not null default 'INR',
  provider     text not null,
  provider_ref text,
  status       text not null,
  test         boolean not null default false,
  period_end   timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null,
  count   integer not null default 0,
  primary key (user_id, day)
);

create index if not exists billing_events_user_time on public.billing_events (user_id, created_at desc);
create index if not exists invoices_user_time on public.invoices (user_id, created_at desc);

do $$
declare t text;
begin
  foreach t in array array['subscriptions','billing_events','invoices','ai_usage'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('drop policy if exists "%s_select_own" on public.%I', t, t);
    execute format('create policy "%s_select_own" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t, t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
  end loop;
end $$;

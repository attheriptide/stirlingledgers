-- Stirling Mini Ledger — full schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- If you already ran the earlier kv_days / kv_inventory setup, only the
-- "purchases", "incomes" and "returns" sections below are new — safe to
-- run the whole file again, it uses "if not exists" throughout.

create table if not exists kv_days (
  date date primary key,
  data jsonb not null
);

create table if not exists kv_inventory (
  model text primary key,
  qty integer not null default 0
);

create table if not exists purchases (
  id text primary key,
  date date not null,
  vendor text,
  model text not null,
  qty integer not null default 1,
  cost numeric not null default 0,
  paid numeric not null default 0,
  notes text
);

create table if not exists incomes (
  id text primary key,
  date date not null,
  source text not null,
  amount numeric not null default 0,
  received numeric not null default 0,
  notes text
);

create table if not exists returns (
  id text primary key,
  date date not null,
  kind text not null,        -- 'sale_return' | 'purchase_return'
  party text,
  model text not null,
  qty integer not null default 1,
  amount numeric not null default 0,
  notes text
);

alter table kv_days enable row level security;
alter table kv_inventory enable row level security;
alter table purchases enable row level security;
alter table incomes enable row level security;
alter table returns enable row level security;

drop policy if exists "public access" on kv_days;
drop policy if exists "public access" on kv_inventory;
drop policy if exists "public access" on purchases;
drop policy if exists "public access" on incomes;
drop policy if exists "public access" on returns;

create policy "public access" on kv_days for all using (true) with check (true);
create policy "public access" on kv_inventory for all using (true) with check (true);
create policy "public access" on purchases for all using (true) with check (true);
create policy "public access" on incomes for all using (true) with check (true);
create policy "public access" on returns for all using (true) with check (true);

-- Reminder: these policies leave every table open to anyone holding your
-- anon key and project URL. Fine for a private tool with an unshared link;
-- add Supabase Auth + narrower policies before treating this as protected.

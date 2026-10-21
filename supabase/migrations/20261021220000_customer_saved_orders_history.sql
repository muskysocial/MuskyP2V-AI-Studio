create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('job','account','gift','library')),
  item_id text not null check (char_length(item_id) between 1 and 120),
  title text not null check (char_length(title) between 1 and 200),
  subtitle text,
  target_section text not null check (target_section in ('jobsSection','socialsSection','shopSection','librarySection')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists saved_items_user_created_idx on public.saved_items(user_id, created_at desc);

create table if not exists public.user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('view','saved','unsaved','order_requested','order_updated')),
  item_type text check (item_type in ('job','account','gift','library','account')),
  item_id text,
  title text not null check (char_length(title) between 1 and 200),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists user_activity_user_created_idx on public.user_activity(user_id, created_at desc);

create table if not exists public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_ref text not null unique check (char_length(order_ref) between 4 and 50),
  item_type text not null check (item_type in ('account','gift')),
  item_id text not null,
  item_name text not null check (char_length(item_name) between 1 and 200),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  payment_method text not null default 'whatsapp' check (payment_method in ('whatsapp','paystack','manual')),
  status text not null default 'contact_pending' check (status in ('contact_pending','confirmed','processing','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','refunded')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_orders_user_created_idx on public.customer_orders(user_id, created_at desc);

alter table public.saved_items enable row level security;
alter table public.user_activity enable row level security;
alter table public.customer_orders enable row level security;

drop policy if exists "saved items owner read" on public.saved_items;
create policy "saved items owner read" on public.saved_items for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "saved items owner insert" on public.saved_items;
create policy "saved items owner insert" on public.saved_items for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "saved items owner delete" on public.saved_items;
create policy "saved items owner delete" on public.saved_items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "activity owner read" on public.user_activity;
create policy "activity owner read" on public.user_activity for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "activity owner insert" on public.user_activity;
create policy "activity owner insert" on public.user_activity for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "orders owner read" on public.customer_orders;
create policy "orders owner read" on public.customer_orders for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "orders owner insert pending only" on public.customer_orders;
create policy "orders owner insert pending only" on public.customer_orders for insert to authenticated with check (
  (select auth.uid()) = user_id and status = 'contact_pending' and payment_status = 'unpaid'
);
drop policy if exists "orders admin read" on public.customer_orders;
create policy "orders admin read" on public.customer_orders for select to authenticated using (public.is_admin());
drop policy if exists "orders admin update" on public.customer_orders;
create policy "orders admin update" on public.customer_orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, delete on public.saved_items to authenticated;
grant select, insert on public.user_activity to authenticated;
grant select, insert, update on public.customer_orders to authenticated;

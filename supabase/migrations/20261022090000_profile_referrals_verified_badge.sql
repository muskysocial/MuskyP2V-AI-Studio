-- Referral rewards and verified badge requests for MuskySocials.
-- Existing balances are not changed by this migration.

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references auth.users(id) on delete set null,
  add column if not exists is_verified boolean not null default false;

update public.profiles
set referral_code = 'MS' || upper(substr(replace(id::text, '-', ''), 1, 12))
where referral_code is null;

create unique index if not exists profiles_referral_code_uidx on public.profiles(referral_code);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'pending' check (status in ('pending','qualified','rejected')),
  reward_coins integer not null default 0 check (reward_coins >= 0),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  constraint referrals_no_self_referral check (referrer_id <> referred_user_id)
);
create index if not exists referrals_referrer_status_idx on public.referrals(referrer_id, status);

create table if not exists public.verified_badge_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coins_paid integer not null default 7000 check (coins_paid = 7000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  admin_notes text
);
create unique index if not exists verified_badge_one_pending_per_user
  on public.verified_badge_requests(user_id) where status = 'pending';
create index if not exists verified_badge_user_created_idx
  on public.verified_badge_requests(user_id, created_at desc);

alter table public.referrals enable row level security;
alter table public.verified_badge_requests enable row level security;

drop policy if exists referrals_read_own on public.referrals;
create policy referrals_read_own on public.referrals for select to authenticated
  using (referrer_id = (select auth.uid()));

drop policy if exists verified_badge_read_own_or_admin on public.verified_badge_requests;
create policy verified_badge_read_own_or_admin on public.verified_badge_requests
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  );

drop policy if exists verified_badge_admin_update on public.verified_badge_requests;
create policy verified_badge_admin_update on public.verified_badge_requests
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

grant select on public.referrals to authenticated;
grant select on public.verified_badge_requests to authenticated;
grant update on public.verified_badge_requests to authenticated;

create or replace function public.qualify_referral_for_user(p_user_id uuid)
returns void language plpgsql security definer set search_path to 'public', 'auth'
as $function$
declare
  v_ref public.referrals%rowtype;
  v_reward integer;
  v_qualified_count integer;
  v_rows integer;
begin
  if p_user_id is null then return; end if;
  select * into v_ref from public.referrals
    where referred_user_id = p_user_id and status = 'pending' for update;
  if not found then return; end if;
  if not exists (select 1 from auth.users where id = p_user_id and email_confirmed_at is not null) then return; end if;

  perform 1 from public.profiles where id = v_ref.referrer_id for update;
  if not found then
    update public.referrals set status = 'rejected' where id = v_ref.id;
    return;
  end if;

  select count(*) into v_qualified_count from public.referrals
    where referrer_id = v_ref.referrer_id and status = 'qualified';
  v_reward := case when v_qualified_count >= 10 then 600 else 300 end;

  insert into public.coin_ledger(user_id, transaction_reference, amount, reason, metadata)
  values (v_ref.referrer_id, 'referral:' || v_ref.referred_user_id::text, v_reward,
    'referral_reward', jsonb_build_object('referred_user_id', v_ref.referred_user_id, 'referral_code', v_ref.referral_code))
  on conflict (transaction_reference) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    update public.referrals set status = 'qualified', reward_coins = v_reward,
      qualified_at = coalesce(qualified_at, now()) where id = v_ref.id;
    return;
  end if;

  update public.profiles set paid_coins = coalesce(paid_coins, 0) + v_reward,
    credits = coalesce(daily_credits, 0) + coalesce(paid_coins, 0) + v_reward
    where id = v_ref.referrer_id;
  update public.referrals set status = 'qualified', reward_coins = v_reward, qualified_at = now()
    where id = v_ref.id;
end;
$function$;
revoke all on function public.qualify_referral_for_user(uuid) from public, anon, authenticated;

create or replace function public.process_referral_confirmation()
returns trigger language plpgsql security definer set search_path to 'public', 'auth'
as $function$
begin
  perform public.qualify_referral_for_user(new.id);
  return new;
end;
$function$;
revoke all on function public.process_referral_confirmation() from public, anon, authenticated;

drop trigger if exists on_auth_user_confirmed_referral on auth.users;
create trigger on_auth_user_confirmed_referral after update of email_confirmed_at on auth.users
for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.process_referral_confirmation();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to ''
as $function$
declare
  v_referrer uuid;
  v_referral_code text;
begin
  v_referral_code := upper(trim(coalesce(new.raw_user_meta_data->>'referral_code', '')));
  if v_referral_code <> '' then
    select id into v_referrer from public.profiles
      where referral_code = v_referral_code and id <> new.id limit 1;
  end if;

  insert into public.profiles (id, display_name, credits, email, referral_code, referred_by)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name','Creator'),40), 80, new.email,
    'MS' || upper(substr(replace(new.id::text, '-', ''), 1, 12)), v_referrer);

  if v_referrer is not null then
    insert into public.referrals(referrer_id, referred_user_id, referral_code)
      values (v_referrer, new.id, v_referral_code) on conflict (referred_user_id) do nothing;
    if new.email_confirmed_at is not null then perform public.qualify_referral_for_user(new.id); end if;
  end if;
  return new;
end;
$function$;

create or replace function public.request_verified_badge()
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_verified boolean;
  v_request_id uuid;
  v_status text;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  select is_verified into v_verified from public.profiles where id = v_user for update;
  if not found then raise exception 'Profile not found'; end if;
  if coalesce(v_verified, false) then
    return jsonb_build_object('ok', true, 'status', 'approved', 'already_verified', true);
  end if;
  select status into v_status from public.verified_badge_requests
    where user_id = v_user and status = 'pending' order by created_at desc limit 1;
  if found then return jsonb_build_object('ok', true, 'status', 'pending', 'already_pending', true); end if;

  perform public.spend_credits(7000);
  insert into public.verified_badge_requests(user_id, coins_paid, status)
    values (v_user, 7000, 'pending') returning id into v_request_id;
  insert into public.coin_ledger(user_id, transaction_reference, amount, reason, metadata)
    values (v_user, 'verified-badge:' || v_request_id::text, -7000, 'verified_badge_request',
      jsonb_build_object('request_id', v_request_id));
  return jsonb_build_object('ok', true, 'status', 'pending', 'request_id', v_request_id, 'coins_charged', 7000);
end;
$function$;
revoke all on function public.request_verified_badge() from public, anon;
grant execute on function public.request_verified_badge() to authenticated;

create or replace function public.handle_verified_badge_review()
returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  if new.status is distinct from old.status then
    if old.status <> 'pending' then raise exception 'Reviewed requests cannot be changed'; end if;
    new.reviewed_at := now();
    if new.status = 'approved' then
      update public.profiles set is_verified = true where id = new.user_id;
    elsif new.status = 'rejected' then
      update public.profiles set paid_coins = coalesce(paid_coins, 0) + 7000,
        credits = coalesce(daily_credits, 0) + coalesce(paid_coins, 0) + 7000 where id = new.user_id;
      insert into public.coin_ledger(user_id, transaction_reference, amount, reason, metadata)
        values (new.user_id, 'verified-badge-refund:' || new.id::text, 7000, 'verified_badge_refund',
          jsonb_build_object('request_id', new.id)) on conflict (transaction_reference) do nothing;
    end if;
  end if;
  return new;
end;
$function$;
revoke all on function public.handle_verified_badge_review() from public, anon, authenticated;

drop trigger if exists verified_badge_review_trigger on public.verified_badge_requests;
create trigger verified_badge_review_trigger before update of status on public.verified_badge_requests
for each row execute function public.handle_verified_badge_review();

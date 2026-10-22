create table if not exists public.daily_feature_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_code text not null check (feature_code in ('headswap')),
  usage_date date not null,
  usage_count integer not null default 0 check (usage_count >= 0),
  updated_at timestamptz not null default now(),
  primary key(user_id, feature_code, usage_date)
);
alter table public.daily_feature_usage enable row level security;
create policy "members read own daily feature usage" on public.daily_feature_usage for select to authenticated using (auth.uid()=user_id);
grant select on public.daily_feature_usage to authenticated;

create or replace function public.claim_headswap_daily()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_count integer; v_today date:=(now() at time zone 'Africa/Lagos')::date;
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 if exists(select 1 from public.user_subscriptions where user_id=v_user and status='active' and expires_at>now()) then
  return jsonb_build_object('allowed',true,'unlimited',true);
 end if;
 insert into public.daily_feature_usage(user_id,feature_code,usage_date,usage_count)
 values(v_user,'headswap',v_today,1)
 on conflict(user_id,feature_code,usage_date) do update
   set usage_count=public.daily_feature_usage.usage_count+1,updated_at=now()
   where public.daily_feature_usage.usage_count<1
 returning usage_count into v_count;
 if v_count is null then return jsonb_build_object('allowed',false,'unlimited',false); end if;
 return jsonb_build_object('allowed',true,'unlimited',false);
end; $$;

create or replace function public.release_headswap_daily()
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_today date:=(now() at time zone 'Africa/Lagos')::date;
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 update public.daily_feature_usage set usage_count=greatest(usage_count-1,0),updated_at=now()
 where user_id=v_user and feature_code='headswap' and usage_date=v_today and usage_count>0;
end; $$;
revoke all on function public.claim_headswap_daily() from public,anon;
revoke all on function public.release_headswap_daily() from public,anon;
grant execute on function public.claim_headswap_daily() to authenticated;
grant execute on function public.release_headswap_daily() to authenticated;
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
revoke all on function public.claim_headswap_daily() from public,anon;
grant execute on function public.claim_headswap_daily() to authenticated;
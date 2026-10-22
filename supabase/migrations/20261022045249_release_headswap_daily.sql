create or replace function public.release_headswap_daily()
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_today date:=(now() at time zone 'Africa/Lagos')::date;
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 update public.daily_feature_usage set usage_count=greatest(usage_count-1,0),updated_at=now()
 where user_id=v_user and feature_code='headswap' and usage_date=v_today and usage_count>0;
end; $$;
revoke all on function public.release_headswap_daily() from public,anon;
grant execute on function public.release_headswap_daily() to authenticated;
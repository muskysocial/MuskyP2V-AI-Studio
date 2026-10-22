create or replace function public.get_credits()
returns integer language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_daily integer; v_paid integer; v_refilled timestamptz; v_total integer;
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 select daily_credits,paid_coins,credits_refilled_at into v_daily,v_paid,v_refilled from public.profiles where id=v_user for update;
 if not found then raise exception 'Profile not found'; end if;
 if v_refilled <= now()-interval '24 hours' then v_daily:=80; v_refilled:=now(); end if;
 v_total:=coalesce(v_daily,0)+coalesce(v_paid,0);
 update public.profiles set daily_credits=v_daily,paid_coins=v_paid,credits_refilled_at=v_refilled,credits=v_total where id=v_user;
 return v_total;
end; $$;
create or replace function public.spend_credits(amount integer)
returns integer language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_daily integer; v_paid integer; v_refilled timestamptz; v_total integer; v_from_daily integer;
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 if amount is null or amount<=0 or amount>1000000 then raise exception 'Invalid credit amount'; end if;
 select daily_credits,paid_coins,credits_refilled_at into v_daily,v_paid,v_refilled from public.profiles where id=v_user for update;
 if not found then raise exception 'Profile not found'; end if;
 if v_refilled <= now()-interval '24 hours' then v_daily:=80; v_refilled:=now(); end if;
 if coalesce(v_daily,0)+coalesce(v_paid,0)<amount then raise exception 'Not enough credits'; end if;
 v_from_daily:=least(v_daily,amount); v_daily:=v_daily-v_from_daily; v_paid:=v_paid-(amount-v_from_daily); v_total:=v_daily+v_paid;
 update public.profiles set daily_credits=v_daily,paid_coins=v_paid,credits_refilled_at=v_refilled,credits=v_total where id=v_user;
 return v_total;
end; $$;
revoke all on function public.get_credits() from public,anon;
revoke all on function public.spend_credits(integer) from public,anon;
grant execute on function public.get_credits() to authenticated;
grant execute on function public.spend_credits(integer) to authenticated;
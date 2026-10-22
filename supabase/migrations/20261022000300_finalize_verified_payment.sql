create or replace function public.finalize_paystack_payment(p_reference text,p_paystack_transaction_id text,p_amount_kobo integer,p_currency text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_payment public.payment_transactions%rowtype; v_sub public.user_subscriptions%rowtype; v_now timestamptz:=now(); v_has_sub boolean:=false;
begin
 select * into v_payment from public.payment_transactions where reference=p_reference for update;
 if not found then raise exception 'Payment reference not found'; end if;
 if v_payment.status='paid' then return jsonb_build_object('ok',true,'already_processed',true); end if;
 if v_payment.status<>'pending' then raise exception 'Payment is not pending'; end if;
 if p_amount_kobo<>v_payment.amount_kobo or p_currency<>v_payment.currency or p_currency<>'NGN' then raise exception 'Verified amount or currency mismatch'; end if;
 update public.payment_transactions set status='paid',paystack_transaction_id=p_paystack_transaction_id,paid_at=v_now where id=v_payment.id;
 if v_payment.coins_to_credit>0 then
  update public.profiles set paid_coins=paid_coins+v_payment.coins_to_credit,credits=daily_credits+paid_coins+v_payment.coins_to_credit where id=v_payment.user_id;
  if not found then raise exception 'Profile not found'; end if;
  insert into public.coin_ledger(user_id,transaction_reference,amount,reason,metadata)
  values(v_payment.user_id,v_payment.reference,v_payment.coins_to_credit,'purchase',jsonb_build_object('plan_code',v_payment.plan_code,'amount_kobo',v_payment.amount_kobo))
  on conflict(transaction_reference) do nothing;
 end if;
 if v_payment.membership_days>0 then
  select * into v_sub from public.user_subscriptions where user_id=v_payment.user_id and status='active' and plan_code=v_payment.plan_code and expires_at>v_now order by expires_at desc limit 1 for update;
  v_has_sub:=found;
  update public.user_subscriptions set status='superseded',updated_at=v_now where user_id=v_payment.user_id and status='active' and (plan_code<>v_payment.plan_code or expires_at<=v_now);
  if v_has_sub then
   update public.user_subscriptions set expires_at=greatest(expires_at,v_now)+make_interval(days=>v_payment.membership_days),updated_at=v_now where id=v_sub.id;
  else
   insert into public.user_subscriptions(user_id,plan_code,status,started_at,expires_at) values(v_payment.user_id,v_payment.plan_code,'active',v_now,v_now+make_interval(days=>v_payment.membership_days));
  end if;
 end if;
 return jsonb_build_object('ok',true,'already_processed',false);
end; $$;
revoke all on function public.finalize_paystack_payment(text,text,integer,text) from public,anon,authenticated;
grant execute on function public.finalize_paystack_payment(text,text,integer,text) to service_role;
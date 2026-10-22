-- Prevent a reviewed verified-badge request from being changed later.
-- Rejected requests have already been refunded, so a later approval must not bypass payment.
create or replace function public.handle_verified_badge_review()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status is distinct from old.status then
    if old.status <> 'pending' then
      raise exception 'Reviewed requests cannot be changed';
    end if;
    if new.status not in ('approved','rejected') then
      raise exception 'A pending request can only be approved or rejected';
    end if;
    new.reviewed_at := now();
    if new.status = 'approved' then
      update public.profiles set is_verified = true where id = new.user_id;
    elsif new.status = 'rejected' then
      update public.profiles
      set paid_coins = coalesce(paid_coins, 0) + 7000,
          credits = coalesce(daily_credits, 0) + coalesce(paid_coins, 0) + 7000
      where id = new.user_id;
      insert into public.coin_ledger(user_id, transaction_reference, amount, reason, metadata)
      values (new.user_id, 'verified-badge-refund:' || new.id::text, 7000,
        'verified_badge_refund', jsonb_build_object('request_id', new.id))
      on conflict (transaction_reference) do nothing;
    end if;
  end if;
  return new;
end;
$function$;
revoke all on function public.handle_verified_badge_review() from public, anon, authenticated;

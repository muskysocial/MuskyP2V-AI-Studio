-- Prevent users from forging verification status or changing system-assigned referral attribution.
create or replace function public.protect_profile_reward_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is not null
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    if new.referral_code is distinct from old.referral_code
       or new.referred_by is distinct from old.referred_by
       or new.is_verified is distinct from old.is_verified then
      raise exception 'Referral and verification fields are system-managed';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.protect_profile_reward_fields() from public, anon, authenticated;
drop trigger if exists protect_profile_reward_fields_trigger on public.profiles;
create trigger protect_profile_reward_fields_trigger
before update on public.profiles
for each row execute function public.protect_profile_reward_fields();

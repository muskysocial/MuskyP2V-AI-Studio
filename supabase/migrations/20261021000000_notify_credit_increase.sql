-- Credit notifications are generated inside Postgres, never by the browser.
create or replace function public.notify_credit_increase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  gained integer;
begin
  if new.credits > old.credits then
    gained := new.credits - old.credits;
    insert into public.notifications (user_id, title, message, type, metadata)
    values (
      new.id,
      'Credits added',
      gained::text || ' credits have been added to your account.',
      'credits',
      jsonb_build_object('credits_added', gained, 'balance', new.credits)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_credit_increase_notification on public.profiles;
create trigger profiles_credit_increase_notification
after update of credits on public.profiles
for each row
when (new.credits > old.credits)
execute function public.notify_credit_increase();

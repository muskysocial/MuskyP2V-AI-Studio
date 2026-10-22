-- Create an in-app notification when a member follows another member.
-- The trigger runs server-side so clients cannot forge notification recipients.
create or replace function private.notify_member_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  follower_name text;
begin
  if new.follower_id = new.followed_id then
    return new;
  end if;

  select coalesce(nullif(btrim(p.display_name), ''), 'A member')
    into follower_name
    from public.profiles as p
   where p.id = new.follower_id;

  insert into public.notifications
    (user_id, title, message, type, link, metadata)
  values
    (
      new.followed_id,
      'New follower',
      coalesce(follower_name, 'A member') || ' started following you.',
      'follow',
      '/',
      jsonb_build_object('follower_id', new.follower_id)
    );

  return new;
end;
$function$;

revoke all on function private.notify_member_follow() from public, anon, authenticated;

drop trigger if exists notify_member_follow on public.member_follows;
create trigger notify_member_follow
after insert on public.member_follows
for each row execute function private.notify_member_follow();

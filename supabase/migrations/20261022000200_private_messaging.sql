-- Private direct messaging for authenticated MuskySocials members.
-- Conversation participants are stored in canonical UUID order so each pair has one thread.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_distinct_users check (user_a <> user_b),
  constraint conversations_sorted_users check (user_a < user_b),
  constraint conversations_unique_pair unique (user_a, user_b)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists conversations_user_a_last_message_idx on public.conversations (user_a, last_message_at desc);
create index if not exists conversations_user_b_last_message_idx on public.conversations (user_b, last_message_at desc);
create index if not exists direct_messages_conversation_created_idx on public.direct_messages (conversation_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.direct_messages enable row level security;

drop policy if exists "Participants can read their conversations" on public.conversations;
create policy "Participants can read their conversations" on public.conversations
for select to authenticated
using ((select auth.uid()) = user_a or (select auth.uid()) = user_b);

drop policy if exists "Members can start a conversation involving themselves" on public.conversations;
create policy "Members can start a conversation involving themselves" on public.conversations
for insert to authenticated
with check (
  ((select auth.uid()) = user_a or (select auth.uid()) = user_b)
  and user_a < user_b and user_a <> user_b
);

drop policy if exists "Participants can read messages in their conversations" on public.direct_messages;
create policy "Participants can read messages in their conversations" on public.direct_messages
for select to authenticated
using (exists (
  select 1 from public.conversations c
  where c.id = conversation_id and ((select auth.uid()) = c.user_a or (select auth.uid()) = c.user_b)
));

drop policy if exists "Members can send messages as themselves" on public.direct_messages;
create policy "Members can send messages as themselves" on public.direct_messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and ((select auth.uid()) = c.user_a or (select auth.uid()) = c.user_b)
  )
);

drop policy if exists "Recipients can mark messages as read" on public.direct_messages;
create policy "Recipients can mark messages as read" on public.direct_messages
for update to authenticated
using (
  sender_id <> (select auth.uid())
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and ((select auth.uid()) = c.user_a or (select auth.uid()) = c.user_b)
  )
)
with check (
  sender_id <> (select auth.uid())
  and read_at is not null
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id and ((select auth.uid()) = c.user_a or (select auth.uid()) = c.user_b)
  )
);

revoke all on table public.conversations from anon, authenticated;
revoke all on table public.direct_messages from anon, authenticated;
grant select, insert on table public.conversations to authenticated;
grant select, insert on table public.direct_messages to authenticated;
grant update (read_at) on table public.direct_messages to authenticated;

-- Keep thread ordering and create a private notification without exposing message content.
create or replace function public.handle_direct_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
begin
  if new.sender_id is distinct from (select auth.uid()) then
    raise exception 'Message sender must match the authenticated user';
  end if;

  update public.conversations
    set updated_at = now(), last_message_at = new.created_at
    where id = new.conversation_id
      and (user_a = new.sender_id or user_b = new.sender_id);

  select case when c.user_a = new.sender_id then c.user_b else c.user_a end
    into recipient
    from public.conversations c
    where c.id = new.conversation_id
      and (c.user_a = new.sender_id or c.user_b = new.sender_id);

  if recipient is not null then
    insert into public.notifications (user_id, title, message, type, metadata)
    values (
      recipient,
      'New message',
      'You received a new private message.',
      'message',
      jsonb_build_object('conversation_id', new.conversation_id, 'sender_id', new.sender_id)
    );
  end if;
  return new;
end;
$$;

revoke all on function public.handle_direct_message_insert() from public, anon, authenticated;
drop trigger if exists direct_message_after_insert on public.direct_messages;
create trigger direct_message_after_insert after insert on public.direct_messages
for each row execute function public.handle_direct_message_insert();


-- The notifications table validates type values; explicitly permit private-message alerts.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type = any (array['system','account','credits','order','payment','premium','social','security','message']::text[]));

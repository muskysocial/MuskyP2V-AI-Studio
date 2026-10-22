create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

drop view if exists public.member_follow_counts;
drop view if exists public.member_directory;

create table public.member_directory (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Member',
  bio text,
  country text,
  avatar_path text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  follower_count bigint not null default 0 check (follower_count >= 0),
  following_count bigint not null default 0 check (following_count >= 0)
);

alter table public.member_directory enable row level security;
revoke all on table public.member_directory from public, anon, authenticated;
grant select on table public.member_directory to authenticated;

create policy "Authenticated members can discover public directory"
  on public.member_directory
  for select
  to authenticated
  using (true);

insert into public.member_directory (
  id, display_name, bio, country, avatar_path, is_verified, created_at,
  follower_count, following_count
)
select
  p.id,
  coalesce(nullif(btrim(p.display_name), ''), 'Member'),
  p.bio,
  p.country,
  p.avatar_path,
  coalesce(p.is_verified, false),
  p.created_at,
  (select count(*) from public.member_follows f where f.followed_id = p.id),
  (select count(*) from public.member_follows f where f.follower_id = p.id)
from public.profiles p
on conflict (id) do update set
  display_name = excluded.display_name,
  bio = excluded.bio,
  country = excluded.country,
  avatar_path = excluded.avatar_path,
  is_verified = excluded.is_verified,
  created_at = excluded.created_at,
  follower_count = excluded.follower_count,
  following_count = excluded.following_count;

create or replace function private.sync_member_directory_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.member_directory (
    id, display_name, bio, country, avatar_path, is_verified, created_at,
    follower_count, following_count
  )
  values (
    new.id,
    coalesce(nullif(btrim(new.display_name), ''), 'Member'),
    new.bio,
    new.country,
    new.avatar_path,
    coalesce(new.is_verified, false),
    new.created_at,
    (select count(*) from public.member_follows f where f.followed_id = new.id),
    (select count(*) from public.member_follows f where f.follower_id = new.id)
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    bio = excluded.bio,
    country = excluded.country,
    avatar_path = excluded.avatar_path,
    is_verified = excluded.is_verified,
    created_at = excluded.created_at,
    follower_count = excluded.follower_count,
    following_count = excluded.following_count;
  return new;
end;
$$;

revoke all on function private.sync_member_directory_profile() from public, anon, authenticated;

create trigger sync_member_directory_profile
  after insert or update of display_name, bio, country, avatar_path, is_verified
  on public.profiles
  for each row execute function private.sync_member_directory_profile();

create or replace function private.sync_member_directory_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.member_directory
      set follower_count = (select count(*) from public.member_follows f where f.followed_id = new.followed_id)
      where id = new.followed_id;
    update public.member_directory
      set following_count = (select count(*) from public.member_follows f where f.follower_id = new.follower_id)
      where id = new.follower_id;
    return new;
  else
    update public.member_directory
      set follower_count = (select count(*) from public.member_follows f where f.followed_id = old.followed_id)
      where id = old.followed_id;
    update public.member_directory
      set following_count = (select count(*) from public.member_follows f where f.follower_id = old.follower_id)
      where id = old.follower_id;
    return old;
  end if;
end;
$$;

revoke all on function private.sync_member_directory_follow_counts() from public, anon, authenticated;

create trigger sync_member_directory_follow_counts
  after insert or delete on public.member_follows
  for each row execute function private.sync_member_directory_follow_counts();

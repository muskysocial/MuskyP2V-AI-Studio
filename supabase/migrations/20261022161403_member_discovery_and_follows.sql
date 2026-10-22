create table public.member_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint member_follows_pkey primary key (follower_id, followed_id),
  constraint member_follows_not_self check (follower_id <> followed_id)
);

create index member_follows_followed_id_idx
  on public.member_follows (followed_id);

alter table public.member_follows enable row level security;

revoke all on table public.member_follows from anon, authenticated;
grant select, insert, delete on table public.member_follows to authenticated;

create policy "Members read their own follow relationships"
  on public.member_follows
  for select
  to authenticated
  using ((select auth.uid()) = follower_id or (select auth.uid()) = followed_id);

create policy "Members can follow from their own account"
  on public.member_follows
  for insert
  to authenticated
  with check ((select auth.uid()) = follower_id and follower_id <> followed_id);

create policy "Members can unfollow from their own account"
  on public.member_follows
  for delete
  to authenticated
  using ((select auth.uid()) = follower_id);

create view public.member_directory
  with (security_barrier = true)
as
select
  p.id,
  coalesce(nullif(btrim(p.display_name), ''), 'Member') as display_name,
  p.bio,
  p.country,
  p.avatar_path,
  p.is_verified,
  p.created_at
from public.profiles as p;

revoke all on table public.member_directory from public, anon, authenticated;
grant select on table public.member_directory to authenticated;

create view public.member_follow_counts
  with (security_barrier = true)
as
with followers as (
  select followed_id as user_id, count(*)::bigint as follower_count
  from public.member_follows
  group by followed_id
),
following as (
  select follower_id as user_id, count(*)::bigint as following_count
  from public.member_follows
  group by follower_id
)
select
  p.id as user_id,
  coalesce(f.follower_count, 0)::bigint as follower_count,
  coalesce(g.following_count, 0)::bigint as following_count
from public.profiles as p
left join followers as f on f.user_id = p.id
left join following as g on g.user_id = p.id;

revoke all on table public.member_follow_counts from public, anon, authenticated;
grant select on table public.member_follow_counts to authenticated;

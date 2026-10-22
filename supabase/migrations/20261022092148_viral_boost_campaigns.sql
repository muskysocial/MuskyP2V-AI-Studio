-- MuskySocials Viral Boost Studio: private media uploads and owner-only promotion drafts.
create table if not exists public.viral_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  post_url text,
  platforms text[] not null default '{}',
  caption text not null default '',
  hashtags text not null default '',
  asset_path text,
  original_file_name text,
  content_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  constraint viral_campaigns_has_content check (
    (asset_path is not null) or (post_url is not null and char_length(trim(post_url)) > 0)
  )
);

create index if not exists viral_campaigns_user_created_idx
  on public.viral_campaigns (user_id, created_at desc);

alter table public.viral_campaigns enable row level security;

drop policy if exists "Users read own viral campaigns" on public.viral_campaigns;
create policy "Users read own viral campaigns"
  on public.viral_campaigns for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create own viral campaigns" on public.viral_campaigns;
create policy "Users create own viral campaigns"
  on public.viral_campaigns for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own viral campaigns" on public.viral_campaigns;
create policy "Users delete own viral campaigns"
  on public.viral_campaigns for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Keep uploaded media private; each user's files live under their auth UUID folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'viral-uploads',
  'viral-uploads',
  false,
  104857600,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime','video/x-m4v']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own viral media" on storage.objects;
create policy "Users upload own viral media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'viral-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users read own viral media" on storage.objects;
create policy "Users read own viral media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'viral-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete own viral media" on storage.objects;
create policy "Users delete own viral media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'viral-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

grant select, insert, delete on public.viral_campaigns to authenticated;

-- Allow authenticated owners to edit their own Viral Boost campaign drafts.
drop policy if exists "Users update own viral campaigns" on public.viral_campaigns;
create policy "Users update own viral campaigns"
  on public.viral_campaigns for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant update on public.viral_campaigns to authenticated;

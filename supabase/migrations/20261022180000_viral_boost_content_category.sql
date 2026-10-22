-- Persist category choices used for tailored captions and hashtags.
alter table public.viral_campaigns
  add column if not exists content_category text not null default 'other'
  check (content_category in ('fashion','business','entertainment','education','food','travel','fitness','gaming','technology','music','other'));

create index if not exists social_oauth_states_user_idx
  on public.social_oauth_states (user_id);
create index if not exists social_publish_jobs_campaign_idx
  on public.social_publish_jobs (campaign_id);

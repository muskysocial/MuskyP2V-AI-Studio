-- Secure, one-time coin deduction and request tracking for Viral Boost.
alter table public.viral_campaigns
  add column if not exists media_type text not null default 'picture',
  add column if not exists promotion_status text not null default 'draft',
  add column if not exists promotion_cost integer,
  add column if not exists promotion_requested_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.viral_campaigns'::regclass
      and conname = 'viral_campaigns_media_type_check'
  ) then
    alter table public.viral_campaigns
      add constraint viral_campaigns_media_type_check
      check (media_type in ('picture', 'video'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.viral_campaigns'::regclass
      and conname = 'viral_campaigns_promotion_status_check'
  ) then
    alter table public.viral_campaigns
      add constraint viral_campaigns_promotion_status_check
      check (promotion_status in ('draft', 'requested', 'processing', 'fulfilled', 'failed', 'refunded'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.viral_campaigns'::regclass
      and conname = 'viral_campaigns_promotion_cost_check'
  ) then
    alter table public.viral_campaigns
      add constraint viral_campaigns_promotion_cost_check
      check (promotion_cost is null or promotion_cost in (950, 1020));
  end if;
end $$;

-- Preserve the actual type of older uploaded videos.
update public.viral_campaigns
set media_type = case when content_type like 'video/%' then 'video' else 'picture' end
where media_type = 'picture';

create or replace function public.request_viral_campaign_promotion(p_campaign_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_user uuid := auth.uid();
  v_campaign public.viral_campaigns%rowtype;
  v_cost integer;
  v_balance integer;
begin
  if v_user is null then
    raise exception 'Sign in required';
  end if;
  if p_campaign_id is null then
    raise exception 'Campaign is required';
  end if;

  select *
    into v_campaign
    from public.viral_campaigns
   where id = p_campaign_id
     and user_id = v_user
   for update;

  if not found then
    raise exception 'Campaign not found or access denied';
  end if;
  if v_campaign.promotion_status <> 'draft' then
    raise exception 'Promotion already requested; duplicate charging is blocked';
  end if;
  if nullif(btrim(v_campaign.post_url), '') is null
     and nullif(btrim(v_campaign.asset_path), '') is null then
    raise exception 'Add a post link or media file before promoting';
  end if;
  if coalesce(cardinality(v_campaign.platforms), 0) < 1 then
    raise exception 'Choose at least one platform before promoting';
  end if;
  if v_campaign.media_type not in ('picture', 'video') then
    raise exception 'Choose picture or video promotion type';
  end if;

  v_cost := case when v_campaign.media_type = 'video' then 1020 else 950 end;
  v_balance := public.spend_credits(v_cost);

  update public.viral_campaigns
     set promotion_status = 'requested',
         promotion_cost = v_cost,
         promotion_requested_at = now()
   where id = v_campaign.id
     and user_id = v_user;

  return jsonb_build_object(
    'campaign_id', v_campaign.id,
    'status', 'requested',
    'cost', v_cost,
    'balance', v_balance,
    'message', 'Promotion request recorded; external advertising fulfillment is not connected.'
  );
end;
$function$;

revoke all on function public.request_viral_campaign_promotion(uuid) from public, anon;
grant execute on function public.request_viral_campaign_promotion(uuid) to authenticated;

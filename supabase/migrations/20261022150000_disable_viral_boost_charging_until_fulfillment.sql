-- Fail closed: paid promotion cannot charge until a real fulfillment integration exists.
-- Existing clients calling the old RPC receive an error and cannot deduct credits.
create or replace function public.request_viral_campaign_promotion(p_campaign_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  raise exception 'Paid promotion is temporarily unavailable. No coins were charged because advertising delivery is not connected.';
end;
$function$;

revoke all on function public.request_viral_campaign_promotion(uuid) from public, anon, authenticated;

-- The auth.users trigger invokes this function; client roles must not call it directly.
revoke all on function public.handle_new_user() from public, anon, authenticated;

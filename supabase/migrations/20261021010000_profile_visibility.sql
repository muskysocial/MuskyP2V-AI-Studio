-- Store the member's preferred visibility for their profile.
-- Enforcement across public profile surfaces must be applied wherever profiles are queried.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_profile_visibility_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_profile_visibility_check
      CHECK (profile_visibility IN ('public', 'members', 'private'));
  END IF;
END
$$;

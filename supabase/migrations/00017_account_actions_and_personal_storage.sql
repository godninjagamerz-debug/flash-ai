ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS disabled_reason text,
  ADD COLUMN IF NOT EXISTS disabled_at timestamptz;

CREATE TABLE IF NOT EXISTS public.account_action_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL CHECK (action IN ('disabled', 'enabled', 'deleted')),
  reason text,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_action_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view account action log" ON public.account_action_log;
CREATE POLICY "Admins can view account action log"
  ON public.account_action_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('flash_user_files', 'flash_user_files', false, 1073741824)
ON CONFLICT (id) DO UPDATE
SET public = false, file_size_limit = 1073741824;

DROP POLICY IF EXISTS "Users can list own personal files" ON storage.objects;
CREATE POLICY "Users can list own personal files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'flash_user_files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload own personal files" ON storage.objects;
CREATE POLICY "Users can upload own personal files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'flash_user_files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own personal files" ON storage.objects;
CREATE POLICY "Users can update own personal files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'flash_user_files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'flash_user_files' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own personal files" ON storage.objects;
CREATE POLICY "Users can delete own personal files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'flash_user_files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.enforce_flash_user_storage_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner text;
  v_used bigint;
  v_new_size bigint;
BEGIN
  IF NEW.bucket_id <> 'flash_user_files' THEN
    RETURN NEW;
  END IF;

  v_owner := split_part(NEW.name, '/', 1);
  IF v_owner !~ '^[0-9a-fA-F-]{36}$'
    OR (auth.uid() IS NOT NULL AND v_owner <> auth.uid()::text) THEN
    RAISE EXCEPTION 'Personal files must be stored under the authenticated user folder';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_owner, 0));
  v_new_size := COALESCE(NULLIF(NEW.metadata->>'size', '')::bigint, 0);

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(SUM(COALESCE(NULLIF(metadata->>'size', '')::bigint, 0)), 0)
      INTO v_used
      FROM storage.objects
      WHERE bucket_id = 'flash_user_files'
        AND split_part(name, '/', 1) = v_owner
        AND id <> OLD.id;
  ELSE
    SELECT COALESCE(SUM(COALESCE(NULLIF(metadata->>'size', '')::bigint, 0)), 0)
      INTO v_used
      FROM storage.objects
      WHERE bucket_id = 'flash_user_files'
        AND split_part(name, '/', 1) = v_owner;
  END IF;

  IF v_used + v_new_size > 1073741824 THEN
    RAISE EXCEPTION 'Personal storage quota exceeded (1 GiB)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flash_user_storage_quota ON storage.objects;
CREATE TRIGGER flash_user_storage_quota
  BEFORE INSERT OR UPDATE ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_flash_user_storage_quota();
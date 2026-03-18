-- ============================================================
-- Profile avatar upload (Topla'da profil resmi)
-- ============================================================

-- Profiles table columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_image_url text,
  ADD COLUMN IF NOT EXISTS profile_image_path text;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Everyone can view avatar images
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
CREATE POLICY "Anyone can view profile images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-images');

-- Authenticated users can upload into their own folder
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete only their own avatar objects
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


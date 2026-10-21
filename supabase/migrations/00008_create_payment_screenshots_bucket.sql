/*
# Create payment screenshots storage bucket

## Purpose
Store payment proof screenshots uploaded by users.

## Bucket Configuration
- Name: app-7r35kmgp19mp_payment_screenshots
- Public: false (only authenticated users can access)
- File size limit: 1MB
- Allowed MIME types: image/jpeg, image/png, image/jpg

## Security
- Users can upload their own payment screenshots
- Users can view their own screenshots
- Admins can view all screenshots
*/

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-7r35kmgp19mp_payment_screenshots',
  'app-7r35kmgp19mp_payment_screenshots',
  false,
  1048576, -- 1MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload payment screenshots
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-7r35kmgp19mp_payment_screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own screenshots
CREATE POLICY "Users can view own payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-7r35kmgp19mp_payment_screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all screenshots
CREATE POLICY "Admins can view all payment screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'app-7r35kmgp19mp_payment_screenshots' AND
  is_admin(auth.uid())
);
-- Create storage buckets for prompt images and thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('prompt-images', 'prompt-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('prompt-thumbnails', 'prompt-thumbnails', true, 1048576, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for prompt-images bucket
CREATE POLICY "Public can view prompt images"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-images');

CREATE POLICY "Authenticated users can upload prompt images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prompt-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own prompt images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prompt-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own prompt images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prompt-images' 
  AND auth.role() = 'authenticated'
);

-- RLS policies for prompt-thumbnails bucket
CREATE POLICY "Public can view prompt thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompt-thumbnails');

CREATE POLICY "Authenticated users can upload prompt thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prompt-thumbnails' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own prompt thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prompt-thumbnails' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own prompt thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prompt-thumbnails' 
  AND auth.role() = 'authenticated'
);
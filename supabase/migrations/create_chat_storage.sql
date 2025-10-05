-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload images to their own folder
CREATE POLICY "Users can upload chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own images
CREATE POLICY "Users can view their own chat images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own chat images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can view images (for sharing)
CREATE POLICY "Public can view chat images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-images');

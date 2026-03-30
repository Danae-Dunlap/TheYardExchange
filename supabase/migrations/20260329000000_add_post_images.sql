-- Add image_url column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create posts storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the posts bucket
CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'posts');

-- Allow public read access to post images
CREATE POLICY "Public read access to post images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'posts');

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = (select auth.uid())::text);

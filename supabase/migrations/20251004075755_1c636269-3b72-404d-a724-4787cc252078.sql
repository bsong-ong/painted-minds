-- Create drawings storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('drawings', 'drawings', false);

-- Allow users to upload their own drawings
CREATE POLICY "Users can upload their own drawings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'drawings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own drawings
CREATE POLICY "Users can view their own drawings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'drawings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own drawings
CREATE POLICY "Users can update their own drawings"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'drawings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own drawings
CREATE POLICY "Users can delete their own drawings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'drawings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
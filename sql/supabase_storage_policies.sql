-- Make the bucket private (replace 'bucket' with your bucket name if different)
UPDATE storage.buckets SET public = false WHERE name = 'bucket';

-- Allow authenticated users to INSERT (upload) into this bucket
CREATE POLICY "allow_authenticated_insert_bucket" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'bucket' AND auth.role() = 'authenticated');

-- Allow authenticated users to SELECT (read) objects in this bucket
CREATE POLICY "allow_authenticated_select_bucket" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'bucket' AND auth.role() = 'authenticated');

-- Optional: allow authenticated users to UPDATE (overwrite) their objects
CREATE POLICY "allow_authenticated_update_bucket" ON storage.objects
  FOR UPDATE
  WITH CHECK (bucket_id = 'bucket' AND auth.role() = 'authenticated');

-- Optional: allow authenticated users to DELETE their objects
CREATE POLICY "allow_authenticated_delete_bucket" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'bucket' AND auth.role() = 'authenticated');

-- Note: Run these statements in Supabase SQL editor (SQL) or via supabase-cli.
-- For public buckets you can instead set `public = true` on the bucket and remove policies.

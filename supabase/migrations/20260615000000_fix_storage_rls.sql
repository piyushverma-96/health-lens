-- Fix storage bucket and RLS policies for reports upload
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow users to upload reports to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to reports bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from reports bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to reports bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from reports bucket" ON storage.objects;

CREATE POLICY "Allow public uploads to reports bucket" ON storage.objects
    FOR INSERT TO public
    WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Allow public read from reports bucket" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'reports');

CREATE POLICY "Allow public update to reports bucket" ON storage.objects
    FOR UPDATE TO public
    USING (bucket_id = 'reports');

CREATE POLICY "Allow public delete from reports bucket" ON storage.objects
    FOR DELETE TO public
    USING (bucket_id = 'reports');

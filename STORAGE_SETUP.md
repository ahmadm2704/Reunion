# Supabase Storage Bucket Setup

## Quick Fix for "Bucket not found" Error

The "Bucket not found" error occurs because the `photos` storage bucket hasn't been created in your Supabase project yet.

## Option 1: Create Bucket via Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** or **"Create bucket"**
4. Set the following:
   - **Name**: `photos`
   - **Public bucket**: ✅ **Enable** (toggle it ON)
   - Click **"Create bucket"**

5. After creating the bucket, go to **Storage** → **Policies** (or click on the `photos` bucket)
6. Create these policies:

   **Policy 1: Allow Public Uploads**
   - Policy name: `Allow public uploads`
   - Target roles: `public`
   - Allowed operation: `INSERT`
   - Policy definition: `bucket_id = 'photos'`

   **Policy 2: Allow Public Reads**
   - Policy name: `Allow public reads`
   - Target roles: `public`
   - Allowed operation: `SELECT`
   - Policy definition: `bucket_id = 'photos'`

## Option 2: Create via SQL Editor

1. Go to **SQL Editor** in Supabase
2. Run this SQL:

```sql
-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for photos (allow public uploads)
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'photos');

-- Create storage policy for photos (allow public reads)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');
```

## Verify Setup

After creating the bucket:
1. Go to **Storage** → You should see `photos` bucket listed
2. Try submitting the registration form again
3. The photo should upload successfully

## Note

- The registration form will still work without the bucket (registration will be saved, but photo won't be uploaded)
- Once you create the bucket, all future registrations will include photos
- Existing registrations without photos will show a placeholder in the admin dashboard


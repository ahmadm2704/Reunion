-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  kit_number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  car_number_plate TEXT NOT NULL,
  house TEXT NOT NULL,
  profession TEXT NOT NULL,
  postal_address TEXT NOT NULL,
  attend_gala TEXT NOT NULL,
  morale TEXT NOT NULL,
  excited_for_gala TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create index on kit_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_kit_number ON registrations(kit_number);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email ON registrations(email);

-- Create admin_settings table for storing admin password
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin password (change this after first login)
-- Default password: admin123
INSERT INTO admin_settings (setting_key, setting_value)
VALUES ('admin_password', 'admin123')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access admin settings
CREATE POLICY "Only service role can access admin settings"
ON admin_settings FOR ALL
TO service_role
USING (true);

-- Enable Row Level Security (RLS)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for registration)
CREATE POLICY "Allow public inserts"
ON registrations FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow authenticated users to read (for admin)
-- Note: In production, you should use proper authentication
CREATE POLICY "Allow authenticated reads"
ON registrations FOR SELECT
TO authenticated
USING (true);

-- Allow service role to read all registrations (for admin API)
CREATE POLICY "Allow service role reads"
ON registrations FOR SELECT
TO service_role
USING (true);

-- Allow service role to delete registrations (for admin API)
CREATE POLICY "Allow service role deletes"
ON registrations FOR DELETE
TO service_role
USING (true);


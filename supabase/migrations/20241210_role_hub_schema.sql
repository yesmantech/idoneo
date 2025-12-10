-- Add Banner Fields to Categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS home_banner_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS inner_banner_url TEXT;

-- Add Metadata to Roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS available_positions TEXT;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS share_bank_link TEXT;

-- Create Role Resources Table
CREATE TABLE IF NOT EXISTS role_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'link', -- 'link', 'pdf'
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE role_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for role_resources" ON role_resources
    FOR SELECT USING (true);

CREATE POLICY "Admin write access for role_resources" ON role_resources
    FOR ALL USING (auth.role() = 'service_role' OR auth.email() = 'alessandro.valenza@gmail.com');

-- STORAGE: Create 'banners' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'banners'
CREATE POLICY "Public Access Banners" ON storage.objects
    FOR SELECT USING ( bucket_id = 'banners' );

CREATE POLICY "Authenticated Upload Banners" ON storage.objects
    FOR INSERT WITH CHECK ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Update Banners" ON storage.objects
    FOR UPDATE USING ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

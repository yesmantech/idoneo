-- =====================================================
-- IDONEO Blog System - Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Blog Categories
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Blog Tags
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'tema', -- 'concorso', 'materia', 'tema'
    concorso_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blog Authors
CREATE TABLE IF NOT EXISTS blog_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    content JSONB DEFAULT '[]'::jsonb,
    cover_image_url TEXT,
    author_id UUID REFERENCES blog_authors(id) ON DELETE SET NULL,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    reading_time_minutes INTEGER DEFAULT 5,
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- SEO Fields
    seo_title TEXT,
    seo_description TEXT,
    canonical_url TEXT,
    og_image_url TEXT,
    is_noindex BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0
);

-- 5. Blog Post Tags (Join Table)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_type ON blog_tags(type);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Categories: Public read, admin write
CREATE POLICY "Public can read categories"
ON blog_categories FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated can manage categories"
ON blog_categories FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Tags: Public read, admin write
CREATE POLICY "Public can read tags"
ON blog_tags FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated can manage tags"
ON blog_tags FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Authors: Public read, admin write
CREATE POLICY "Public can read authors"
ON blog_authors FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated can manage authors"
ON blog_authors FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Posts: Public read published, authenticated full access
CREATE POLICY "Public can read published posts"
ON blog_posts FOR SELECT TO anon
USING (status = 'published' AND published_at <= NOW());

CREATE POLICY "Authenticated can read all posts"
ON blog_posts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert posts"
ON blog_posts FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update posts"
ON blog_posts FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete posts"
ON blog_posts FOR DELETE TO authenticated
USING (true);

-- Post Tags: Same as posts
CREATE POLICY "Public can read post tags"
ON blog_post_tags FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated can manage post tags"
ON blog_post_tags FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- =====================================================
-- Seed Initial Categories
-- =====================================================
INSERT INTO blog_categories (slug, name, description, sort_order) VALUES
('guide-studio', 'Guide allo Studio', 'Guide pratiche e strategie per preparare i concorsi', 1),
('news-concorsi', 'News Concorsi', 'Novità e aggiornamenti sui concorsi pubblici', 2),
('concorsi-bandi', 'Concorsi & Bandi', 'Informazioni su bandi attivi e scadenze', 3),
('aggiornamenti-idoneo', 'Aggiornamenti IDONEO', 'Novità sulla piattaforma IDONEO', 4),
('strategie-mindset', 'Strategie & Mindset', 'Consigli per la motivazione e la gestione dello studio', 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Create default author (run after auth user exists)
-- =====================================================
INSERT INTO blog_authors (display_name, bio) VALUES
('Team IDONEO', 'Il team di IDONEO, la piattaforma per prepararti ai concorsi pubblici.');


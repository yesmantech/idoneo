-- ================================================
-- BANDI (Public Tenders) Schema
-- Migration: 20260201_bandi_schema.sql
-- ================================================

-- ================================================
-- 1. ENTI (Public Entities)
-- ================================================
CREATE TABLE IF NOT EXISTS enti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    type TEXT CHECK (type IN ('comune', 'provincia', 'regione', 'ministero', 'forze_ordine', 'forze_armate', 'asl', 'universita', 'agenzia', 'altro')),
    region TEXT,
    province TEXT,
    city TEXT,
    website TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Slug generation trigger
CREATE OR REPLACE FUNCTION generate_ente_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := regexp_replace(NEW.slug, '-+$', '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enti_slug_trigger
    BEFORE INSERT OR UPDATE ON enti
    FOR EACH ROW EXECUTE FUNCTION generate_ente_slug();

-- ================================================
-- 2. BANDI CATEGORIES
-- ================================================
CREATE TABLE IF NOT EXISTS bandi_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES bandi_categories(id),
    icon TEXT,
    color TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default categories
INSERT INTO bandi_categories (name, slug, icon, sort_order) VALUES
    ('Amministrativi', 'amministrativi', '📋', 1),
    ('Tecnici', 'tecnici', '🔧', 2),
    ('Polizia Locale', 'polizia-locale', '👮', 3),
    ('Sanitari', 'sanitari', '🏥', 4),
    ('Istruzione', 'istruzione', '📚', 5),
    ('Forze Armate', 'forze-armate', '🎖️', 6),
    ('Magistratura', 'magistratura', '⚖️', 7),
    ('Dirigenti', 'dirigenti', '💼', 8),
    ('Altro', 'altro', '📁', 99)
ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- 3. BANDI (Main Table)
-- ================================================
CREATE TABLE IF NOT EXISTS bandi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    ente_id UUID REFERENCES enti(id) ON DELETE SET NULL,
    category_id UUID REFERENCES bandi_categories(id) ON DELETE SET NULL,
    
    -- Positions
    seats_total INT,
    seats_reserved INT DEFAULT 0,
    contract_type TEXT CHECK (contract_type IN ('tempo_indeterminato', 'tempo_determinato', 'formazione_lavoro', 'interinale', 'altro')),
    salary_range TEXT,
    salary_min NUMERIC,
    salary_max NUMERIC,
    
    -- Requirements
    education_level TEXT[] DEFAULT '{}',
    age_min INT,
    age_max INT,
    other_requirements JSONB DEFAULT '{}',
    
    -- Location
    region TEXT,
    province TEXT,
    city TEXT,
    is_remote BOOLEAN DEFAULT false,
    
    -- Dates
    publication_date DATE,
    deadline TIMESTAMPTZ NOT NULL,
    exam_date TIMESTAMPTZ,
    
    -- Application
    application_url TEXT,
    application_method TEXT,
    
    -- Content
    description TEXT,
    short_description TEXT,
    exam_stages JSONB DEFAULT '[]',
    
    -- Status & Visibility
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'closed', 'suspended')),
    is_featured BOOLEAN DEFAULT false,
    views_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    
    -- Source tracking
    source_urls TEXT[] DEFAULT '{}',
    source_type TEXT CHECK (source_type IN ('gu', 'inpa', 'ente', 'manual')),
    source_id TEXT,
    last_checked_at TIMESTAMPTZ,
    confidence_score FLOAT DEFAULT 1.0,
    
    -- Search
    search_vector TSVECTOR,
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Authors
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    published_by UUID REFERENCES auth.users(id)
);

-- Slug generation for bandi
CREATE OR REPLACE FUNCTION generate_bando_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        base_slug := regexp_replace(base_slug, '-+$', '');
        base_slug := left(base_slug, 80);
        final_slug := base_slug;
        
        WHILE EXISTS (SELECT 1 FROM bandi WHERE slug = final_slug AND id != NEW.id) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;
        
        NEW.slug := final_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bandi_slug_trigger
    BEFORE INSERT OR UPDATE ON bandi
    FOR EACH ROW EXECUTE FUNCTION generate_bando_slug();

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_bandi_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('italian', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('italian', coalesce(NEW.short_description, '')), 'B') ||
        setweight(to_tsvector('italian', coalesce(NEW.description, '')), 'C') ||
        setweight(to_tsvector('italian', coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bandi_search_trigger
    BEFORE INSERT OR UPDATE ON bandi
    FOR EACH ROW EXECUTE FUNCTION update_bandi_search_vector();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_bandi_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bandi_updated_at_trigger
    BEFORE UPDATE ON bandi
    FOR EACH ROW EXECUTE FUNCTION update_bandi_timestamp();

-- ================================================
-- 4. BANDI DOCUMENTS
-- ================================================
CREATE TABLE IF NOT EXISTS bandi_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bando_id UUID REFERENCES bandi(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bando', 'allegato', 'rettifica', 'calendario', 'graduatoria', 'altro')),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type TEXT,
    publication_date DATE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- ================================================
-- 5. BANDI UPDATES (Rettifiche, Proroghe, etc.)
-- ================================================
CREATE TABLE IF NOT EXISTS bandi_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bando_id UUID REFERENCES bandi(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('rettifica', 'proroga', 'calendario', 'risultati', 'diario', 'altro')),
    title TEXT NOT NULL,
    description TEXT,
    publication_date DATE,
    document_id UUID REFERENCES bandi_documents(id) ON DELETE SET NULL,
    is_important BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- ================================================
-- 6. USER BANDI SAVES (Watchlist)
-- ================================================
CREATE TABLE IF NOT EXISTS user_bandi_saves (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bando_id UUID REFERENCES bandi(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT now(),
    notify_deadline BOOLEAN DEFAULT true,
    notify_updates BOOLEAN DEFAULT true,
    notes TEXT,
    PRIMARY KEY (user_id, bando_id)
);

-- Update saves count on bando
CREATE OR REPLACE FUNCTION update_bando_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE bandi SET saves_count = saves_count + 1 WHERE id = NEW.bando_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE bandi SET saves_count = saves_count - 1 WHERE id = OLD.bando_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_bandi_saves_count_trigger
    AFTER INSERT OR DELETE ON user_bandi_saves
    FOR EACH ROW EXECUTE FUNCTION update_bando_saves_count();

-- ================================================
-- 7. USER BANDI ALERTS
-- ================================================
CREATE TABLE IF NOT EXISTS user_bandi_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    criteria JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 8. BANDI VERSIONS (Audit/History)
-- ================================================
CREATE TABLE IF NOT EXISTS bandi_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bando_id UUID REFERENCES bandi(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    data JSONB NOT NULL,
    changed_fields TEXT[],
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT now(),
    change_reason TEXT
);

-- Auto-create version on update
CREATE OR REPLACE FUNCTION create_bando_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INT;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM bandi_versions WHERE bando_id = NEW.id;
    
    INSERT INTO bandi_versions (bando_id, version_number, data, changed_by)
    VALUES (
        NEW.id,
        next_version,
        row_to_json(OLD)::jsonb,
        NEW.updated_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bandi_version_trigger
    AFTER UPDATE ON bandi
    FOR EACH ROW EXECUTE FUNCTION create_bando_version();

-- ================================================
-- 9. ADMIN AUDIT LOG
-- ================================================
CREATE TABLE IF NOT EXISTS bandi_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish', 'unpublish', 'bulk_import', 'restore')),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- 10. INDEXES
-- ================================================

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_bandi_search ON bandi USING GIN(search_vector);

-- Common filters
CREATE INDEX IF NOT EXISTS idx_bandi_status ON bandi(status);
CREATE INDEX IF NOT EXISTS idx_bandi_deadline ON bandi(deadline) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_bandi_category ON bandi(category_id);
CREATE INDEX IF NOT EXISTS idx_bandi_region ON bandi(region);
CREATE INDEX IF NOT EXISTS idx_bandi_ente ON bandi(ente_id);
CREATE INDEX IF NOT EXISTS idx_bandi_featured ON bandi(is_featured) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_bandi_published_at ON bandi(published_at DESC) WHERE status = 'published';

-- User saves
CREATE INDEX IF NOT EXISTS idx_user_bandi_saves_user ON user_bandi_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bandi_saves_bando ON user_bandi_saves(bando_id);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_user_bandi_alerts_user ON user_bandi_alerts(user_id) WHERE is_active = true;

-- Documents
CREATE INDEX IF NOT EXISTS idx_bandi_documents_bando ON bandi_documents(bando_id);

-- Updates
CREATE INDEX IF NOT EXISTS idx_bandi_updates_bando ON bandi_updates(bando_id);

-- Versions
CREATE INDEX IF NOT EXISTS idx_bandi_versions_bando ON bandi_versions(bando_id);

-- ================================================
-- 11. ROW LEVEL SECURITY
-- ================================================

-- Enable RLS
ALTER TABLE enti ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandi_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandi ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandi_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandi_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bandi_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bandi_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandi_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandi_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "Public can read active enti" ON enti
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active categories" ON bandi_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read published bandi" ON bandi
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read documents of published bandi" ON bandi_documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM bandi WHERE id = bando_id AND status = 'published')
    );

CREATE POLICY "Public can read updates of published bandi" ON bandi_updates
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM bandi WHERE id = bando_id AND status = 'published')
    );

-- User saves/alerts - users manage their own
CREATE POLICY "Users manage own saves" ON user_bandi_saves
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own alerts" ON user_bandi_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Admin policies (full access for service role)
-- In production, add specific admin role checks

-- ================================================
-- 12. HELPER FUNCTIONS
-- ================================================

-- Get days remaining until deadline
CREATE OR REPLACE FUNCTION bando_days_remaining(bando bandi)
RETURNS INT AS $$
BEGIN
    RETURN GREATEST(0, EXTRACT(DAY FROM bando.deadline - now())::INT);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check if bando is closing soon (within 7 days)
CREATE OR REPLACE FUNCTION bando_is_closing_soon(bando bandi)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN bando.deadline > now() AND bando.deadline < now() + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

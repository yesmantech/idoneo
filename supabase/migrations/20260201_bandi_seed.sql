-- ============================================
-- BANDI SEED DATA
-- Categorie + Bandi di esempio
-- ============================================

-- Insert default categories
INSERT INTO bandi_categories (name, slug, icon, color, sort_order) VALUES
('Forze Armate', 'forze-armate', '🎖️', '#22c55e', 1),
('Forze dell''Ordine', 'forze-ordine', '👮', '#3b82f6', 2),
('Pubblica Amministrazione', 'pubblica-amministrazione', '🏛️', '#8b5cf6', 3),
('Sanità', 'sanita', '🏥', '#ef4444', 4),
('Istruzione', 'istruzione', '📚', '#f59e0b', 5),
('Giustizia', 'giustizia', '⚖️', '#6366f1', 6),
('Enti Locali', 'enti-locali', '🏢', '#14b8a6', 7),
('Agenzia delle Entrate', 'agenzia-entrate', '📊', '#f97316', 8),
('Università', 'universita', '🎓', '#84cc16', 9),
('Infrastrutture e Trasporti', 'infrastrutture-trasporti', '🚂', '#0ea5e9', 10)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample enti
INSERT INTO enti (name, slug, type, region) VALUES
('Ministero della Difesa', 'ministero-difesa', 'ministero', NULL),
('Arma dei Carabinieri', 'arma-carabinieri', 'forze_ordine', NULL),
('Polizia di Stato', 'polizia-stato', 'forze_ordine', NULL),
('Guardia di Finanza', 'guardia-finanza', 'forze_ordine', NULL),
('Aeronautica Militare', 'aeronautica-militare', 'forze_armate', NULL),
('Esercito Italiano', 'esercito-italiano', 'forze_armate', NULL),
('Marina Militare', 'marina-militare', 'forze_armate', NULL),
('INPS', 'inps', 'agenzia', NULL),
('Agenzia delle Entrate', 'agenzia-entrate', 'agenzia', NULL),
('Comune di Roma', 'comune-roma', 'comune', 'Lazio'),
('Regione Lombardia', 'regione-lombardia', 'regione', 'Lombardia')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample bandi (only if table is empty)
DO $$
DECLARE
    v_ente_carabinieri UUID;
    v_ente_polizia UUID;
    v_ente_gdf UUID;
    v_ente_esercito UUID;
    v_ente_inps UUID;
    v_cat_forze_ordine UUID;
    v_cat_forze_armate UUID;
    v_cat_pa UUID;
BEGIN
    -- Only insert if no bandi exist
    IF NOT EXISTS (SELECT 1 FROM bandi LIMIT 1) THEN
        -- Get IDs
        SELECT id INTO v_ente_carabinieri FROM enti WHERE slug = 'arma-carabinieri';
        SELECT id INTO v_ente_polizia FROM enti WHERE slug = 'polizia-stato';
        SELECT id INTO v_ente_gdf FROM enti WHERE slug = 'guardia-finanza';
        SELECT id INTO v_ente_esercito FROM enti WHERE slug = 'esercito-italiano';
        SELECT id INTO v_ente_inps FROM enti WHERE slug = 'inps';
        SELECT id INTO v_cat_forze_ordine FROM bandi_categories WHERE slug = 'forze-ordine';
        SELECT id INTO v_cat_forze_armate FROM bandi_categories WHERE slug = 'forze-armate';
        SELECT id INTO v_cat_pa FROM bandi_categories WHERE slug = 'pubblica-amministrazione';

        -- Bando 1: Carabinieri
        INSERT INTO bandi (
            title, slug, ente_id, category_id, status,
            short_description, description,
            seats_total, seats_reserved, contract_type,
            education_level, age_min, age_max,
            publication_date, deadline, exam_date,
            application_method, application_url,
            is_featured
        ) VALUES (
            'Concorso Allievi Marescialli 2026',
            'concorso-allievi-marescialli-2026',
            v_ente_carabinieri, v_cat_forze_ordine, 'published',
            'Concorso per 536 allievi marescialli dell''Arma dei Carabinieri',
            '## Descrizione

Il Ministero della Difesa ha indetto un concorso pubblico per l''ammissione al 13° corso triennale di 536 allievi marescialli dell''Arma dei Carabinieri.

## Requisiti
- Cittadinanza italiana
- Età compresa tra 17 e 26 anni
- Diploma di istruzione secondaria di secondo grado
- Idoneità fisica, psichica e attitudinale

## Prove d''esame
1. **Prova scritta** - Test a risposta multipla
2. **Prova di efficienza fisica**
3. **Accertamenti psico-fisici**
4. **Colloquio attitudinale**',
            536, 50, 'tempo_indeterminato',
            ARRAY['diploma'], 17, 26,
            '2026-01-15', '2026-03-15', '2026-04-20',
            'online', 'https://concorsi.difesa.it',
            true
        );

        -- Bando 2: Polizia di Stato
        INSERT INTO bandi (
            title, slug, ente_id, category_id, status,
            short_description, description,
            seats_total, contract_type,
            education_level, age_min, age_max,
            publication_date, deadline,
            application_method,
            is_featured
        ) VALUES (
            'Concorso Agenti Polizia di Stato 2026',
            'concorso-agenti-polizia-stato-2026',
            v_ente_polizia, v_cat_forze_ordine, 'published',
            'Concorso per 1500 agenti della Polizia di Stato',
            '## Bando

Concorso pubblico per l''assunzione di 1500 agenti della Polizia di Stato.

## Requisiti principali
- Cittadinanza italiana
- Età tra 18 e 26 anni (30 per VFP)
- Diploma di scuola secondaria
- Idoneità psico-fisica',
            1500, 'tempo_indeterminato',
            ARRAY['diploma'], 18, 26,
            '2026-01-20', '2026-02-28',
            'online',
            true
        );

        -- Bando 3: Guardia di Finanza
        INSERT INTO bandi (
            title, slug, ente_id, category_id, status,
            short_description, description,
            seats_total, contract_type,
            education_level, age_min, age_max,
            publication_date, deadline,
            application_method
        ) VALUES (
            'Concorso Finanzieri 2026',
            'concorso-finanzieri-2026',
            v_ente_gdf, v_cat_forze_ordine, 'published',
            'Concorso per 930 allievi finanzieri',
            '## Informazioni

Bando di concorso per il reclutamento di 930 allievi finanzieri.

## Requisiti
- Cittadinanza italiana
- Età inferiore a 26 anni
- Diploma di scuola secondaria di secondo grado',
            930, 'tempo_indeterminato',
            ARRAY['diploma'], 18, 26,
            '2026-01-10', '2026-02-15',
            'online'
        );

        -- Bando 4: Esercito VFP1
        INSERT INTO bandi (
            title, slug, ente_id, category_id, status,
            short_description, description,
            seats_total, contract_type,
            education_level, age_min, age_max,
            publication_date, deadline,
            application_method
        ) VALUES (
            'VFP1 Esercito - 1° Blocco 2026',
            'vfp1-esercito-1-blocco-2026',
            v_ente_esercito, v_cat_forze_armate, 'published',
            'Arruolamento VFP1 nell''Esercito Italiano',
            '## Volontari in Ferma Prefissata

Bando per l''arruolamento di volontari in ferma prefissata di un anno (VFP1) nell''Esercito Italiano.

## Requisiti minimi
- Cittadinanza italiana
- Età tra 18 e 25 anni
- Diploma di istruzione secondaria di primo grado',
            4000, 'tempo_determinato',
            ARRAY['licenza_media'], 18, 25,
            '2026-01-05', '2026-02-05',
            'online'
        );

        -- Bando 5: INPS - In scadenza
        INSERT INTO bandi (
            title, slug, ente_id, category_id, status,
            short_description, description,
            seats_total, contract_type,
            education_level,
            publication_date, deadline,
            application_method, region
        ) VALUES (
            'Concorso Funzionari Amministrativi INPS',
            'concorso-funzionari-inps-2026',
            v_ente_inps, v_cat_pa, 'published',
            '1858 posti per funzionari area amministrativa',
            '## Concorso INPS

Concorso pubblico per l''assunzione a tempo indeterminato di 1858 unità di personale nell''area dei funzionari amministrativi.

## Titolo di studio richiesto
Laurea triennale o magistrale',
            1858, 'tempo_indeterminato',
            ARRAY['laurea_triennale', 'laurea_magistrale'],
            '2025-12-15', '2026-02-03',
            'online', 'nazionale'
        );

    END IF;
END $$;

-- Add helpful comments
COMMENT ON TABLE bandi IS 'Bandi di concorso pubblico con informazioni complete';
COMMENT ON TABLE enti IS 'Enti pubblici che pubblicano bandi di concorso';
COMMENT ON TABLE bandi_categories IS 'Categorie per organizzare i bandi';

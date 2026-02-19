
-- Delete last 50 imported bandi to verify enrichment on re-import
DELETE FROM bandi 
WHERE id IN (
    SELECT id 
    FROM bandi 
    WHERE source_type = 'inpa' 
    ORDER BY created_at DESC 
    LIMIT 50
);

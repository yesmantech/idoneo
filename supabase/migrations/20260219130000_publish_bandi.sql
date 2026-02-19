-- Publish all imported bandi so they appear on the live site
UPDATE bandi
SET status = 'published'
WHERE status = 'draft' AND source_type = 'inpa';

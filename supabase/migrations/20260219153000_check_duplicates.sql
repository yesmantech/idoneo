-- Function to check for duplicate source_ids
CREATE OR REPLACE FUNCTION check_duplicates()
RETURNS TABLE (
    source_id text,
    count bigint,
    ids uuid[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.source_id, 
        count(*) as count,
        array_agg(b.id) as ids
    FROM bandi b
    WHERE b.source_id IS NOT NULL
    GROUP BY b.source_id
    HAVING count(*) > 1;
END;
$$ LANGUAGE plpgsql;

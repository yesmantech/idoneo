-- Enable the pgvector extension if not already enabled
create extension if not exists vector;

-- Add the embedding column to the bandi table (OpenAI text-embedding-3-small uses 1536 dimensions)
alter table bandi 
add column if not exists embedding vector(1536);

-- Create an HNSW index for fast similarity search using cosine distance
create index if not exists bandi_embedding_idx 
on bandi 
using hnsw (embedding vector_cosine_ops);

-- Create the RPC function to match bandi based on embeddings and filters
create or replace function match_bandi (
  query_embedding vector(1536),
  match_threshold float default 0.3,
  match_count int default 10,
  filter_region text default null,
  filter_education text default null
)
returns table (
  id uuid,
  title text,
  ente_name text,
  region text,
  province text,
  seats_total int,
  education_level text[],
  deadline timestamptz,
  application_url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    b.id,
    b.title,
    e.name as ente_name,
    b.region,
    b.province,
    b.seats_total,
    b.education_level,
    b.deadline,
    b.application_url,
    1 - (b.embedding <=> query_embedding) as similarity
  from bandi b
  left join enti e on b.ente_id = e.id
  where b.status = 'published'
    and b.deadline > now()
    and b.embedding is not null
    and 1 - (b.embedding <=> query_embedding) > match_threshold
    and (filter_region is null or b.region ilike '%' || filter_region || '%')
    and (filter_education is null or filter_education = any(b.education_level))
  order by b.embedding <=> query_embedding
  limit match_count;
end;
$$;

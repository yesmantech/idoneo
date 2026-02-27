-- Function to increment bando views
create or replace function increment_bando_views(bando_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update bandi
  set views_count = views_count + 1
  where id = bando_id;
end;
$$;

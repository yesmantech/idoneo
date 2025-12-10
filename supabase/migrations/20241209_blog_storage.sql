-- Create the storage bucket for blog images
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- Policy to allow public access to images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'blog-images' );

-- Policy to allow authenticated users to upload images
create policy "Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'blog-images' );

-- Policy to allow authenticated users to update/delete their own uploads (optional but good practice)
create policy "Authenticated Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'blog-images' );

create policy "Authenticated Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'blog-images' );

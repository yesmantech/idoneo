-- Create the storage bucket for user avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy to allow public access to images
create policy "Public Access Avatars"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Policy to allow authenticated users to upload images
create policy "Authenticated Upload Avatars"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' );

-- Policy to allow authenticated users to update/delete their own uploads
create policy "Authenticated Delete Avatars"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'avatars' );

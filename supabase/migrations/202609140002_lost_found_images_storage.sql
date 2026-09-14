-- Optional post images: public reads, authenticated owner-only object writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lost-found-images', 'lost-found-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "image owners upload to own post path" on storage.objects for insert to authenticated with check (
  bucket_id = 'lost-found-images' and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = auth.uid()::text and array_length(storage.foldername(name), 1) = 3
);
create policy "image owners update own post path" on storage.objects for update to authenticated using (
  bucket_id = 'lost-found-images' and (storage.foldername(name))[1] = 'posts' and (storage.foldername(name))[2] = auth.uid()::text
) with check (
  bucket_id = 'lost-found-images' and (storage.foldername(name))[1] = 'posts'
  and (storage.foldername(name))[2] = auth.uid()::text and array_length(storage.foldername(name), 1) = 3
);
create policy "image owners delete own post path" on storage.objects for delete to authenticated using (
  bucket_id = 'lost-found-images' and (storage.foldername(name))[1] = 'posts' and (storage.foldername(name))[2] = auth.uid()::text
);

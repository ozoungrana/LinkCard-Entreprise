-- Adds a WhatsApp contact field to profiles, plus a public storage bucket for
-- card photos. Upload paths are namespaced by the uploader's auth uid
-- (`${auth.uid()}/...`) so ownership can be checked with a simple prefix
-- match, mirroring the profiles.owner_id = auth.uid() pattern used elsewhere.

alter table public.profiles
  add column if not exists whatsapp_number text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly readable"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own avatar"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Spec 002 · design Migration 3 (K9): public bucket for event covers.
-- No storage.objects policies for anon/authenticated, so API roles cannot
-- upload, replace or delete. The MOVA team uploads covers in Supabase Studio.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-covers', 'event-covers', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

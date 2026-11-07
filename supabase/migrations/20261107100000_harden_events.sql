-- Spec 002 review SEC-6, SEC-8, SEC-9 (docs/reviews/spec-002-implementation-review.md).
-- A new migration: earlier migrations stay as reviewed and approved.

-- SEC-6: service_role keeps data access but not TRUNCATE, REFERENCES or TRIGGER.
revoke truncate, references, trigger on public.events, public.cities from service_role;

-- SEC-8: allowlisted URL prefixes must not be bypassable with path traversal,
-- encoded dots, backslashes or very long values.
alter table public.events drop constraint events_maps_url_check;
alter table public.events add constraint events_maps_url_check check (
  maps_url ~ '^https://(www\.google\.com/maps/|maps\.app\.goo\.gl/|maps\.apple\.com/)'
  and maps_url !~ '(\.\.|%2[eE]|\x5c)' and char_length(maps_url) <= 2048);

alter table public.events drop constraint events_registration_url_check;
alter table public.events add constraint events_registration_url_check check (
  registration_url ~ '^https://(docs\.google\.com/forms/|forms\.gle/)'
  and registration_url !~ '(\.\.|%2[eE]|\x5c)' and char_length(registration_url) <= 2048);

alter table public.events drop constraint events_cover_image_url_check;
alter table public.events add constraint events_cover_image_url_check check (
  cover_image_url ~ '^https://'
  and cover_image_url !~ '(\.\.|%2[eE]|\x5c|\s)' and char_length(cover_image_url) <= 2048);

-- SEC-9: no contact details in the organiser name, even with spaces between digits
-- or a messenger link.
alter table public.events drop constraint events_organizer_not_contact;
alter table public.events add constraint events_organizer_not_contact check (
  organizer_name !~ '@'
  and regexp_replace(organizer_name, '\D', '', 'g') !~ '[0-9]{6,}'
  and organizer_name !~* '(t\.me/|wa\.me/|https?://)');

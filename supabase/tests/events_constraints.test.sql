-- Spec 002 · REQ-016, 019, 030, 044, 051, 053 (S16, S34): data rules and triggers.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

create temporary table base as
select (select id from public.cities where slug = 'da-nang') as city_id;

select lives_ok(
  $$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
    select 'pgtap-valid', city_id, 'Valid event', 'Valid description', 'social', array['en'],
           now() + interval '1 day', now() + interval '1 day 2 hours', 'My Khe', 'free', 'MOVA Team' from base$$,
  'a valid event is accepted');

-- Every rule below rejects the row with check_violation (23514).
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name, solo_friendly)
  select 'pgtap-solo', city_id, 'Solo', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team', true from base$$,
  '23514', null, 'Solo-friendly without solo details is rejected (REQ-030)');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
  select 'pgtap-paid', city_id, 'Paid', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'paid', 'MOVA Team' from base$$,
  '23514', null, 'paid without a price is rejected');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, price_vnd, organizer_name)
  select 'pgtap-free', city_id, 'Free', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 50000, 'MOVA Team' from base$$,
  '23514', null, 'free with a price is rejected');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
  select 'pgtap-time', city_id, 'Time', 'D', 'social', array['en'], now() + interval '2 days', now() + interval '1 day', 'Area', 'free', 'MOVA Team' from base$$,
  '23514', null, 'an end before the start is rejected');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
  select 'Bad Slug', city_id, 'Slug', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team' from base$$,
  '23514', null, 'an invalid slug is rejected');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
  select 'pgtap-lang', city_id, 'Lang', 'D', 'social', array['de'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team' from base$$,
  '23514', null, 'an unknown event language is rejected');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name, venue_status, venue_name, maps_url)
  select 'pgtap-maps', city_id, 'Maps', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team', 'confirmed', 'Venue', 'https://evil.example/map' from base$$,
  '23514', null, 'a maps link outside the allowlist is rejected');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name, maps_url)
  select 'pgtap-maps-tbc', city_id, 'Maps', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team', 'https://maps.app.goo.gl/x' from base$$,
  '23514', null, 'a maps link with a TBC venue is rejected');
select throws_ok($$insert into public.events (slug, city_id, status, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
  select 'pgtap-cancel', city_id, 'cancelled', 'Cancel', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team' from base$$,
  '23514', null, 'cancelled without a note is rejected');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name, venue_status)
  select 'pgtap-venue', city_id, 'Venue', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team', 'confirmed' from base$$,
  '23514', null, 'a confirmed venue without a name is rejected');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
  select 'pgtap-org', city_id, 'Org', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'host@example.com' from base$$,
  '23514', null, 'an organiser name containing an email is rejected (REQ-019)');
select throws_ok($$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name, registration_url)
  select 'pgtap-reg', city_id, 'Reg', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team', 'https://evil.example/form' from base$$,
  '23514', null, 'a registration link outside Google Forms is rejected (REQ-053)');
select lives_ok($$insert into public.events (slug, status, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name, registration_url)
  select 'pgtap-reg-ok', 'published', city_id, 'Reg', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team', 'https://forms.gle/abc123' from base$$,
  'a published event with a Google Forms registration link is accepted');
select throws_ok($$insert into public.cities (slug, name, country_code, time_zone) values ('pgtap-bad-tz', 'Bad Zone', 'VN', 'Mars/Olympus')$$,
  '23514', null, 'an unknown IANA time zone is rejected (REQ-051)');

-- Trigger: published_at and material_changed_at (REQ-016)
select isnt((select published_at from public.events where slug = 'pgtap-reg-ok'), null, 'publishing sets published_at');
update public.events set title = 'Renamed event' where slug = 'pgtap-reg-ok';
select is((select material_changed_at from public.events where slug = 'pgtap-reg-ok'), null, 'a title change is not a material change');
update public.events set venue_status = 'confirmed', venue_name = 'New venue' where slug = 'pgtap-reg-ok';
select isnt((select material_changed_at from public.events where slug = 'pgtap-reg-ok'), null, 'a venue change after publication is a material change');

insert into public.events (slug, status, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
select 'pgtap-draft-edit', 'draft', city_id, 'Draft', 'D', 'social', array['en'], now() + interval '1 day', now() + interval '1 day 1 hour', 'Area', 'free', 'MOVA Team' from base;
update public.events set venue_status = 'confirmed', venue_name = 'Somewhere' where slug = 'pgtap-draft-edit';
select is((select material_changed_at from public.events where slug = 'pgtap-draft-edit'), null, 'editing a draft is not a material change');
select is((select published_at from public.events where slug = 'pgtap-draft-edit'), null, 'a draft has no published_at');

select * from finish();
rollback;

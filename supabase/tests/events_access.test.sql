-- Spec 002 · REQ-043, 045, 051 (S22, S23, S26): privileges and RLS, positive and negative.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Fixtures (as the table owner)
insert into public.cities (slug, name, country_code, time_zone, is_active)
values ('pgtap-hidden-city', 'Hidden City', 'JP', 'Asia/Tokyo', false);

insert into public.events (slug, status, city_id, title, description, category, languages,
                           starts_at, ends_at, area, price_type, organizer_name, cancellation_note)
select v.slug, v.status::public.event_status, c.id, 'Event ' || v.slug, 'Description', 'social', array['en'],
       now() + interval '1 day', now() + interval '1 day 2 hours', 'My Khe', 'free', 'MOVA Team', v.note
from (values
  ('pgtap-published', 'published', 'da-nang', null),
  ('pgtap-draft', 'draft', 'da-nang', null),
  ('pgtap-cancelled', 'cancelled', 'da-nang', 'Storm warning'),
  ('pgtap-archived', 'archived', 'da-nang', null),
  ('pgtap-hidden', 'published', 'pgtap-hidden-city', null)
) as v(slug, status, city, note)
join public.cities c on c.slug = v.city;

-- Structure
select ok((select relrowsecurity from pg_class where oid = 'public.events'::regclass), 'RLS enabled on events');
select ok((select relrowsecurity from pg_class where oid = 'public.cities'::regclass), 'RLS enabled on cities');
select policies_are('public', 'events', array['events_read_visible'], 'events has only the read policy');
select policies_are('public', 'cities', array['cities_read_active'], 'cities has only the read policy');
select table_privs_are('public', 'events', 'anon', array['SELECT'], 'anon: SELECT only on events');
select table_privs_are('public', 'events', 'authenticated', array['SELECT'], 'authenticated: SELECT only on events');
select table_privs_are('public', 'cities', 'anon', array['SELECT'], 'anon: SELECT only on cities');
select table_privs_are('public', 'cities', 'authenticated', array['SELECT'], 'authenticated: SELECT only on cities');
select function_privs_are('public', 'events_set_derived_fields', array[]::text[], 'anon', array[]::text[],
  'anon cannot execute the events trigger function');

-- anon
set local role anon;
select results_eq(
  $$select slug from public.events where slug like 'pgtap-%' order by slug$$,
  $$values ('pgtap-cancelled'::text), ('pgtap-published'::text)$$,
  'anon sees only published and cancelled events of active cities');
select is_empty($$select 1 from public.events where slug = 'pgtap-draft'$$, 'anon cannot read a draft by slug');
select is_empty($$select 1 from public.events where slug = 'pgtap-hidden'$$, 'anon cannot read events of inactive cities');
select is_empty($$select 1 from public.cities where slug = 'pgtap-hidden-city'$$, 'anon cannot read inactive cities');
select isnt_empty($$select 1 from public.cities where slug = 'da-nang'$$, 'anon can read active cities');
select throws_ok(
  $$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
    values ('pgtap-anon-insert', (select id from public.cities where slug = 'da-nang'), 'Title', 'Description', 'social',
            array['en'], now(), now() + interval '1 hour', 'Area', 'free', 'Organizer')$$,
  '42501', null, 'anon cannot insert events');
select throws_ok($$update public.events set title = 'Hacked'$$, '42501', null, 'anon cannot update events');
select throws_ok($$delete from public.events$$, '42501', null, 'anon cannot delete events');
select throws_ok($$truncate public.events$$, '42501', null, 'anon cannot truncate events');
select throws_ok(
  $$insert into public.cities (slug, name, country_code, time_zone) values ('pgtap-evil', 'Evil', 'VN', 'Asia/Ho_Chi_Minh')$$,
  '42501', null, 'anon cannot insert cities');
select throws_ok($$update public.cities set is_active = true$$, '42501', null, 'anon cannot update cities');
select throws_ok($$delete from public.cities$$, '42501', null, 'anon cannot delete cities');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('event-covers', 'pgtap.png')$$,
  '42501', null, 'anon cannot upload event covers');
reset role;

-- authenticated
set local role authenticated;
select results_eq(
  $$select slug from public.events where slug like 'pgtap-%' order by slug$$,
  $$values ('pgtap-cancelled'::text), ('pgtap-published'::text)$$,
  'authenticated sees only published and cancelled events of active cities');
select throws_ok(
  $$insert into public.events (slug, city_id, title, description, category, languages, starts_at, ends_at, area, price_type, organizer_name)
    values ('pgtap-auth-insert', (select id from public.cities where slug = 'da-nang'), 'Title', 'Description', 'social',
            array['en'], now(), now() + interval '1 hour', 'Area', 'free', 'Organizer')$$,
  '42501', null, 'authenticated cannot insert events');
select throws_ok($$update public.events set title = 'Hacked'$$, '42501', null, 'authenticated cannot update events');
select throws_ok($$delete from public.events$$, '42501', null, 'authenticated cannot delete events');
select throws_ok($$truncate public.events$$, '42501', null, 'authenticated cannot truncate events');
select throws_ok($$update public.cities set is_active = true$$, '42501', null, 'authenticated cannot update cities');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('event-covers', 'pgtap-auth.png')$$,
  '42501', null, 'authenticated cannot upload event covers');
reset role;

-- Denied operations changed nothing
select is((select count(*)::int from public.events where slug like 'pgtap-%'), 5, 'no event rows were added or removed');
select is((select title from public.events where slug = 'pgtap-published'), 'Event pgtap-published', 'no event was modified');
select is((select is_active from public.cities where slug = 'pgtap-hidden-city'), false, 'no city was activated');

select * from finish();
rollback;

-- Local development seed only (`supabase db reset`). Never applied to the hosted
-- project. Fictional events; dates are relative to now() in Da Nang time.

insert into public.cities (slug, name, country_code, time_zone, is_active)
values ('test-city', 'Test City', 'JP', 'Asia/Tokyo', false)
on conflict (slug) do nothing;

with
  dn as (select id from public.cities where slug = 'da-nang'),
  tc as (select id from public.cities where slug = 'test-city'),
  d as (select date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') as day0)
insert into public.events (
  slug, status, city_id, title, description, what_to_expect, category, languages,
  starts_at, ends_at, area, venue_status, venue_name, maps_url, price_type, price_vnd,
  payment_note, organizer_name, solo_friendly, solo_details, registration_url,
  cancellation_note, age_restriction)
select v.slug, v.status::public.event_status, case when v.city = 'test' then tc.id else dn.id end,
       v.title, v.description, v.expect, v.category::public.event_category, v.languages,
       (d.day0 + v.starts) at time zone 'Asia/Ho_Chi_Minh',
       (d.day0 + v.ends) at time zone 'Asia/Ho_Chi_Minh',
       v.area, v.venue_status::public.event_venue_status, v.venue_name, v.maps_url,
       v.price_type::public.event_price_type, v.price_vnd, v.payment_note, 'MOVA Team',
       v.solo, v.solo_details, v.registration_url, v.cancel_note, v.age
from dn, tc, d, (values
  ('beach-social-001', 'published', 'dn', 'Da Nang Beach Social #001',
   'The first MOVA beach social. Meet new people at sunset with games and music.',
   'Icebreaker games, music and plenty of time to talk.', 'beach_outdoors', array['en','vi','ru'],
   interval '3 days 17 hours', interval '3 days 20 hours', 'My Khe', 'tbc', null, null, 'free', null, null,
   true, 'A greeter in a MOVA shirt meets newcomers at the entrance; intro circle at 17:15.',
   'https://forms.gle/mova-beach-social-001-local', null, null),
  ('morning-beach-volleyball', 'published', 'dn', 'Morning Beach Volleyball',
   'Friendly games for all levels. Bring water and sunscreen.', null, 'sports_fitness', array['en','ru'],
   interval '1 day 7 hours', interval '1 day 9 hours', 'Pham Van Dong Beach', 'confirmed',
   'Pham Van Dong Beach, court 2', 'https://maps.app.goo.gl/local-volleyball', 'free', null, null,
   true, 'Teams are mixed at the start, so you will not play alone.', null, null, null),
  ('vietnamese-english-exchange', 'published', 'dn', 'Vietnamese–English Language Exchange',
   'Half the evening in Vietnamese, half in English. Beginners welcome.', null, 'language_exchange', array['vi','en'],
   interval '5 days 19 hours', interval '5 days 21 hours', 'Hai Chau', 'confirmed', 'The Workshop Coffee', null,
   'paid', 50000, 'Includes one drink.', false, null, null, null, null),
  ('rooftop-night', 'cancelled', 'dn', 'Rooftop Night', 'Music and views over the river.', null, 'nightlife', array['en'],
   interval '2 days 21 hours', interval '3 days 1 hour', 'Son Tra', 'confirmed', 'Sky Deck', null,
   'paid', 150000, null, false, null, null, 'The venue is closed for a private event.', 18),
  ('draft-secret-event', 'draft', 'dn', 'Draft event', 'Not public yet.', null, 'social', array['en'],
   interval '4 days 18 hours', interval '4 days 20 hours', 'My Khe', 'tbc', null, null, 'free', null, null,
   false, null, null, null, null),
  ('archived-old-event', 'archived', 'dn', 'Archived event', 'No longer public.', null, 'social', array['en'],
   interval '6 days 18 hours', interval '6 days 20 hours', 'My Khe', 'tbc', null, null, 'free', null, null,
   false, null, null, null, null),
  ('ended-yesterday', 'published', 'dn', 'Ended Yesterday', 'This event has ended.', null, 'social', array['en'],
   interval '-1 day 18 hours', interval '-1 day 20 hours', 'An Thuong', 'tbc', null, null, 'free', null, null,
   false, null, null, null, null),
  ('test-city-event', 'published', 'test', 'Event in an inactive city', 'Hidden until the city is active.', null,
   'social', array['en'], interval '2 days 18 hours', interval '2 days 20 hours', 'Center', 'tbc', null, null,
   'free', null, null, false, null, null, null, null)
) as v(slug, status, city, title, description, expect, category, languages, starts, ends, area,
       venue_status, venue_name, maps_url, price_type, price_vnd, payment_note, solo, solo_details,
       registration_url, cancel_note, age)
on conflict (slug) do nothing;

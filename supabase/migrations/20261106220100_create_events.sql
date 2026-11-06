-- Spec 002 · REQ-016, 019, 030, 043, 044, 051, 053: events schema (design Migration 1, A8, A10).
-- Access control is in the next migration.

create type public.event_status as enum ('draft', 'published', 'cancelled', 'archived');
create type public.event_category as enum (
  'social', 'beach_outdoors', 'sports_fitness', 'food_drink',
  'language_exchange', 'arts_culture', 'workshops', 'nightlife');
create type public.event_price_type as enum ('free', 'paid');
create type public.event_venue_status as enum ('confirmed', 'tbc');

create table public.events (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique
                        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  status              public.event_status not null default 'draft',
  city_id             uuid not null references public.cities(id),
  title               text not null check (char_length(btrim(title)) between 3 and 120),
  description         text not null check (char_length(btrim(description)) between 1 and 4000),
  what_to_expect      text check (char_length(what_to_expect) <= 2000),
  category            public.event_category not null,
  languages           text[] not null check (
                        cardinality(languages) between 1 and 4
                        and languages <@ array['en', 'vi', 'ru', 'other']::text[]),
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  area                text not null check (char_length(btrim(area)) between 2 and 80),
  venue_status        public.event_venue_status not null default 'tbc',
  venue_name          text check (char_length(venue_name) <= 120),
  venue_address       text check (char_length(venue_address) <= 200),
  maps_url            text check (maps_url ~ '^https://(www\.google\.com/maps/|maps\.app\.goo\.gl/|maps\.apple\.com/)'),
  price_type          public.event_price_type not null,
  price_vnd           integer check (price_vnd between 1000 and 100000000),
  payment_note        text check (char_length(payment_note) <= 200),
  organizer_name      text not null check (char_length(btrim(organizer_name)) between 2 and 80),
  age_restriction     smallint check (age_restriction in (16, 18, 21)),
  accessibility_notes text check (char_length(accessibility_notes) <= 500),
  solo_friendly       boolean not null default false,
  solo_details        text check (char_length(solo_details) <= 500),
  cover_image_url     text check (cover_image_url ~ '^https://'),
  registration_url    text check (registration_url ~ '^https://(docs\.google\.com/forms/|forms\.gle/)'),
  cancellation_note   text check (char_length(cancellation_note) <= 300),
  change_note         text check (char_length(change_note) <= 300),
  material_changed_at timestamptz,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint events_time_order check (ends_at > starts_at),
  constraint events_price_consistent check (
    (price_type = 'free' and price_vnd is null) or (price_type = 'paid' and price_vnd is not null)),
  constraint events_solo_requires_details check (
    not solo_friendly or char_length(btrim(coalesce(solo_details, ''))) >= 10),
  constraint events_confirmed_venue_named check (venue_status = 'tbc' or venue_name is not null),
  constraint events_maps_only_when_confirmed check (maps_url is null or venue_status = 'confirmed'),
  constraint events_cancellation_note check (status <> 'cancelled' or cancellation_note is not null),
  constraint events_organizer_not_contact check (
    organizer_name !~ '@' and organizer_name !~ '[0-9]{6,}')
);

comment on table public.events is 'Public events (Spec 002). Readable by API roles only when published or cancelled in an active city.';
comment on column public.events.registration_url is 'Temporary Google Forms registration bridge (REQ-053), until the RSVP spec.';

create index events_city_id_idx on public.events (city_id);
create index events_visible_starts_at_idx on public.events (city_id, starts_at)
  where status in ('published', 'cancelled');
create index events_visible_ends_at_idx on public.events (city_id, ends_at)
  where status in ('published', 'cancelled');

create function public.events_set_derived_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status <> 'draft' and new.published_at is null then
    new.published_at := now();
  end if;
  if tg_op = 'UPDATE' and old.status in ('published', 'cancelled')
     and (new.starts_at, new.ends_at, new.venue_status, new.venue_name, new.venue_address)
         is distinct from
         (old.starts_at, old.ends_at, old.venue_status, old.venue_name, old.venue_address) then
    new.material_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger events_set_derived_fields
  before insert or update on public.events
  for each row execute function public.events_set_derived_fields();

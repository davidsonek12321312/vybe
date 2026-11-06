-- Spec 002 · REQ-051 (ADR-0016): cities are data. Da Nang is reference data, not a constant.

create table public.cities (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique
                 check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 80),
  name         text not null check (char_length(btrim(name)) between 2 and 80),
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  time_zone    text not null,
  is_active    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.cities is 'Cities MOVA operates in (ADR-0016). Events reference a city; times use its IANA time zone.';

create function public.cities_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.time_zone) then
    raise exception 'unknown IANA time zone: %', new.time_zone using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger cities_before_write
  before insert or update on public.cities
  for each row execute function public.cities_before_write();

-- Explicit privileges; never rely on platform default privileges (REQ-044).
alter table public.cities enable row level security;
revoke all on table public.cities from public, anon, authenticated;
grant select on table public.cities to anon, authenticated;
grant select, insert, update, delete on table public.cities to service_role;
revoke all on function public.cities_before_write() from public, anon, authenticated;

create policy cities_read_active on public.cities
  for select to anon, authenticated
  using (is_active);

insert into public.cities (slug, name, country_code, time_zone, is_active)
values ('da-nang', 'Da Nang', 'VN', 'Asia/Ho_Chi_Minh', true)
on conflict (slug) do nothing;

-- Spec 002 · REQ-043, REQ-044 (design Migration 2, A8): explicit privileges and RLS for public.events.

alter table public.events enable row level security;

-- Explicit privileges; never rely on platform default privileges.
revoke all on table public.events from public, anon, authenticated;
grant select on table public.events to anon, authenticated;
grant select, insert, update, delete on table public.events to service_role;

revoke all on function public.events_set_derived_fields() from public, anon, authenticated;

-- Published and cancelled events of active cities only. Events of a city that
-- is still being prepared stay private until the city is activated.
create policy events_read_visible on public.events
  for select to anon, authenticated
  using (
    status in ('published', 'cancelled')
    and exists (select 1 from public.cities c where c.id = city_id and c.is_active)
  );

-- No insert, update or delete policies: API-role writes fail on privileges (42501).

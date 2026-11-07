-- Spec 002 review SEC-7: structural guards for the public schema.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- Every ordinary table in public has RLS enabled.
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity),
  0, 'every public table has row level security enabled');

-- No view, materialised view or foreign table is exposed in public (they bypass RLS by default).
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v', 'm', 'f')),
  0, 'public has no views, materialised views or foreign tables');

-- Trigger functions are not callable by API roles.
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (has_function_privilege('anon', p.oid, 'execute') and p.proname in ('cities_before_write', 'events_set_derived_fields'))),
  0, 'anon cannot execute the trigger functions');
select ok(not has_function_privilege('authenticated', 'public.cities_before_write()', 'execute'), 'authenticated cannot execute cities_before_write');
select ok(not has_function_privilege('authenticated', 'public.events_set_derived_fields()', 'execute'), 'authenticated cannot execute events_set_derived_fields');
select ok(not has_function_privilege('anon', 'public.cities_before_write()', 'execute'), 'anon cannot execute cities_before_write');

-- API roles hold no write privileges on the event tables.
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and table_name in ('events', 'cities')
      and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT'),
  0, 'anon and authenticated only have SELECT on events and cities');

-- Exact privilege set for service_role (SEC-6).
select table_privs_are('public', 'events', 'service_role', array['DELETE', 'INSERT', 'SELECT', 'UPDATE'], 'service_role privileges on events');
select table_privs_are('public', 'cities', 'service_role', array['DELETE', 'INSERT', 'SELECT', 'UPDATE'], 'service_role privileges on cities');

-- Storage: no policy on storage.objects lets anon or authenticated write.
select is(
  (select count(*)::int from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')),
  0, 'storage.objects has no write policies');

select * from finish();
rollback;

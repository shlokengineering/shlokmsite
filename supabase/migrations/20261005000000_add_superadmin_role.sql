begin;

drop trigger if exists profiles_guard_role_change on profiles;

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('superadmin', 'admin', 'pending', 'surveyor'));

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

do $$
declare
  profile_count integer;
  shlok_count integer;
  bibek_count integer;
begin
  select count(*) into profile_count from profiles;
  if profile_count > 0 then
    select count(*) into shlok_count
    from profiles
    where regexp_replace(lower(trim(full_name)), '[^a-z0-9]', '', 'g')
      in ('shlokengineering', 'shlokengineeringpvtltd');

    select count(*) into bibek_count
    from profiles
    where regexp_replace(
      regexp_replace(lower(trim(full_name)), '^er[.]?[[:space:]]*', ''),
      '[^a-z0-9]', '', 'g'
    ) = 'bibekadhikari';

    if shlok_count <> 1 or bibek_count <> 1 then
      raise exception
        'Expected one Shlok Engineering profile and one Bibek Adhikari profile (found %, %); update their full names before applying this migration',
        shlok_count, bibek_count;
    end if;
  end if;
end;
$$;

update profiles
set role = 'superadmin'
where regexp_replace(lower(trim(full_name)), '[^a-z0-9]', '', 'g')
  in ('shlokengineering', 'shlokengineeringpvtltd');

update profiles
set role = 'admin'
where regexp_replace(
  regexp_replace(lower(trim(full_name)), '^er[.]?[[:space:]]*', ''),
  '[^a-z0-9]', '', 'g'
) = 'bibekadhikari';

create or replace function enforce_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
begin
  if new.role is distinct from old.role then
    perform pg_advisory_xact_lock(20261004, 1);

    if auth.uid() = old.id then
      raise exception 'users cannot change their own role';
    end if;

    if not is_super_admin() then
      raise exception 'only the super admin can change a profile''s role';
    end if;

    if old.role = 'pending' and new.role = 'surveyor' then
      return new;
    end if;

    if old.role = 'surveyor' and new.role = 'admin' then
      return new;
    end if;

    if old.role = 'admin' and new.role = 'surveyor' then
      select count(*) into admin_count from profiles where role = 'admin';
      if admin_count <= 1 then
        raise exception 'at least one admin account must remain';
      end if;
      return new;
    end if;

    raise exception 'only pending approval, surveyor promotion, and admin demotion are allowed';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_role_change
  before update on profiles
  for each row execute function enforce_profile_role_change();

create or replace function protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
  superadmin_count integer;
begin
  if old.role in ('admin', 'superadmin') then
    perform pg_advisory_xact_lock(20261004, 1);

    if old.role = 'admin' then
      select count(*) into admin_count from profiles where role = 'admin';
      if admin_count <= 1 then
        raise exception 'the last admin account cannot be deleted';
      end if;
    end if;

    if old.role = 'superadmin' then
      select count(*) into superadmin_count from profiles where role = 'superadmin';
      if superadmin_count <= 1 then
        raise exception 'the last super admin account cannot be deleted';
      end if;
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists profiles_protect_last_admin_delete on profiles;
create trigger profiles_protect_last_admin_delete
  before delete on profiles
  for each row execute function protect_last_admin();

commit;

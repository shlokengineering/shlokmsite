create or replace function enforce_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not is_admin() then
      raise exception 'only admins can change a profile''s role';
    end if;

    if old.role = 'admin' then
      raise exception 'existing admins cannot be demoted';
    end if;

    if old.role = 'surveyor' and new.role = 'admin' then
      return new;
    end if;

    if old.role = 'pending' and new.role = 'surveyor' then
      return new;
    end if;

    raise exception 'profiles may only be approved as surveyors or surveyors promoted to admins';
  end if;

  return new;
end;
$$;

create or replace function protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_count integer;
begin
  if old.role = 'admin' then
    perform pg_advisory_xact_lock(20261004, 1);
    select count(*) into admin_count from profiles where role = 'admin';
    if admin_count <= 1 then
      raise exception 'the last admin account cannot be deleted';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists profiles_protect_last_admin_delete on profiles;
create trigger profiles_protect_last_admin_delete
  before delete on profiles
  for each row execute function protect_last_admin();

-- Prevent a surveyor from escalating their own privileges.
-- The existing `profiles_update_self` RLS policy lets a user update their own row (full_name,
-- phone, license_no, etc.), but had no column-level restriction: a logged-in surveyor could call
-- the Supabase client directly (bypassing the UI) and set role = 'admin' on their own row.
-- This trigger blocks any change to `role` unless the caller is already an admin, regardless of
-- which RLS policy allowed the update to proceed.

create or replace function enforce_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'only admins can change a profile''s role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role_change on profiles;
create trigger profiles_guard_role_change
  before update on profiles
  for each row execute function enforce_profile_role_change();

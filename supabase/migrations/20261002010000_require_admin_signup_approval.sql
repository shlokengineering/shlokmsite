-- Reference: Migration 1 - Signup
-- New accounts are pending until an existing administrator approves them as surveyors.
-- Existing admin and surveyor accounts retain their current approved roles.

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'pending', 'surveyor'));
alter table profiles alter column role set default 'pending';

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'pending')
  on conflict (id) do nothing;
  return new;
end;
$$;

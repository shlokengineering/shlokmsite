-- Profile details and private profile-image storage.

alter table profiles add column if not exists email text;
alter table profiles add column if not exists profile_image text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'pending', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists sync_profile_email_on_auth_user_update on auth.users;
create trigger sync_profile_email_on_auth_user_update
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function sync_profile_email();

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', false)
on conflict (id) do nothing;

create policy profile_images_storage_admin on storage.objects for all
  using (bucket_id = 'profile-images' and is_admin())
  with check (bucket_id = 'profile-images' and is_admin());

create policy profile_images_storage_owner on storage.objects for all
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

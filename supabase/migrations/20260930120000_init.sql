-- Insurance Survey Management: initial schema, lifecycle rules, and RLS policies.
-- Run via `supabase db push` or as part of `supabase start`.

create extension if not exists pgcrypto;

-- =========================================================================
-- Tables
-- =========================================================================

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'surveyor' check (role in ('admin', 'surveyor')),
  phone text,
  license_no text,
  created_at timestamptz not null default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  insurer_name text not null,
  insurance_type text not null,
  policy_category text not null,
  policy_no text not null,
  claim_no text not null,
  date_of_accident date not null,
  case_reference_no text not null unique,
  assigned_surveyor_id uuid references profiles (id),
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists insureds (
  id uuid primary key default gen_random_uuid(),
  insured_name text not null,
  insured_company text,
  case_id uuid not null references cases (id) on delete cascade
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_no text not null,
  vehicle_registration_date date,
  vehicle_type text,
  vehicle_category text,
  vehicle_owner text,
  case_id uuid not null references cases (id) on delete cascade
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  driver_name text not null,
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  driving_license text
);

-- visit_no is assigned per-case by the trigger below; PK enforces the append-only sequence.
create table if not exists visits (
  case_id uuid not null references cases (id) on delete cascade,
  visit_no int not null,
  visit_date date not null,
  surveyor_id uuid references profiles (id),
  remarks text,
  created_at timestamptz not null default now(),
  primary key (case_id, visit_no)
);

-- Append-only history of case progress. status_no is assigned per-case by the trigger below.
create table if not exists statuses (
  case_id uuid not null references cases (id) on delete cascade,
  status_no int not null,
  stage text not null check (
    stage in (
      'case_created', 'deputed', 'accepted', 'rejected', 'visit_scheduled',
      'visit_done', 'documents_pending', 'draft_report', 'under_review',
      'submitted', 'closed'
    )
  ),
  status_date date not null,
  surveyor_id uuid references profiles (id),
  status_remarks text,
  created_at timestamptz not null default now(),
  primary key (case_id, status_no)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references cases (id) on delete cascade,
  amount numeric(12, 2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists case_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  kind text not null check (kind in ('photo', 'document', 'report')),
  storage_path text not null,
  uploaded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  version int not null default 1,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'final')),
  submitted_at timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  unique (case_id, version)
);

-- =========================================================================
-- Helper functions (security definer to safely bypass RLS for role checks)
-- =========================================================================

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_assigned_surveyor(target_case_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from cases
    where id = target_case_id and assigned_surveyor_id = auth.uid()
  );
$$;

-- Auto-create a profile stub (default role: surveyor) whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'surveyor')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cases_set_updated_at on cases;
create trigger cases_set_updated_at
  before update on cases
  for each row execute function touch_updated_at();

-- Assigns the next visit_no for the case; clients never set it directly.
create or replace function set_visit_no()
returns trigger
language plpgsql
as $$
begin
  select coalesce(max(visit_no), 0) + 1 into new.visit_no from visits where case_id = new.case_id;
  return new;
end;
$$;

drop trigger if exists visits_set_no on visits;
create trigger visits_set_no
  before insert on visits
  for each row execute function set_visit_no();

-- Assigns the next status_no for the case; clients never set it directly.
create or replace function set_status_no()
returns trigger
language plpgsql
as $$
begin
  select coalesce(max(status_no), 0) + 1 into new.status_no from statuses where case_id = new.case_id;
  return new;
end;
$$;

drop trigger if exists statuses_set_no on statuses;
create trigger statuses_set_no
  before insert on statuses
  for each row execute function set_status_no();

-- Enforce append-only history at the database level per project rules.
create or replace function block_status_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'statuses is append-only: % is not allowed', tg_op;
end;
$$;

drop trigger if exists statuses_block_update on statuses;
create trigger statuses_block_update
  before update on statuses
  for each row execute function block_status_mutation();

drop trigger if exists statuses_block_delete on statuses;
create trigger statuses_block_delete
  before delete on statuses
  for each row execute function block_status_mutation();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table profiles enable row level security;
alter table cases enable row level security;
alter table insureds enable row level security;
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table visits enable row level security;
alter table statuses enable row level security;
alter table payments enable row level security;
alter table case_files enable row level security;
alter table reports enable row level security;

-- profiles: everyone can read their own row; admins can read/update everyone.
create policy profiles_select_self on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_update_self on profiles for update
  using (id = auth.uid() or is_admin());
create policy profiles_admin_insert on profiles for insert
  with check (is_admin());

-- cases: admins have full access; surveyors can only read cases assigned to them.
create policy cases_admin_all on cases for all
  using (is_admin()) with check (is_admin());
create policy cases_surveyor_select on cases for select
  using (assigned_surveyor_id = auth.uid());

-- insureds/vehicles/drivers: set up by admins; surveyors can view for their assigned cases.
create policy insureds_admin_all on insureds for all
  using (is_admin()) with check (is_admin());
create policy insureds_surveyor_select on insureds for select
  using (is_assigned_surveyor(case_id));

create policy vehicles_admin_all on vehicles for all
  using (is_admin()) with check (is_admin());
create policy vehicles_surveyor_select on vehicles for select
  using (is_assigned_surveyor(case_id));

create policy drivers_admin_all on drivers for all
  using (is_admin()) with check (is_admin());
create policy drivers_surveyor_select on drivers for select
  using (is_assigned_surveyor((select case_id from vehicles where vehicles.id = drivers.vehicle_id)));

-- visits: insert/select only (no update/delete) for admins and the assigned surveyor.
create policy visits_select on visits for select
  using (is_admin() or is_assigned_surveyor(case_id));
create policy visits_insert on visits for insert
  with check (is_admin() or is_assigned_surveyor(case_id));

-- statuses: insert/select only; update/delete are blocked entirely by trigger above.
create policy statuses_select on statuses for select
  using (is_admin() or is_assigned_surveyor(case_id));
create policy statuses_insert on statuses for insert
  with check (is_admin() or is_assigned_surveyor(case_id));

-- payments: admin-only (see claude.md open question on surveyor visibility).
create policy payments_admin_all on payments for all
  using (is_admin()) with check (is_admin());

-- case_files: admin full access; assigned surveyor can upload/view for their case.
create policy case_files_admin_all on case_files for all
  using (is_admin()) with check (is_admin());
create policy case_files_surveyor_select on case_files for select
  using (is_assigned_surveyor(case_id));
create policy case_files_surveyor_insert on case_files for insert
  with check (is_assigned_surveyor(case_id));

-- reports: admin full access; assigned surveyor can draft/view/update for their case.
create policy reports_admin_all on reports for all
  using (is_admin()) with check (is_admin());
create policy reports_surveyor_select on reports for select
  using (is_assigned_surveyor(case_id));
create policy reports_surveyor_insert on reports for insert
  with check (is_assigned_surveyor(case_id));
create policy reports_surveyor_update on reports for update
  using (is_assigned_surveyor(case_id)) with check (is_assigned_surveyor(case_id));

-- =========================================================================
-- Storage: private bucket for case photos/documents/reports
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', false)
on conflict (id) do nothing;

-- Objects are expected to be uploaded under a `<case_id>/...` path.
create policy case_files_storage_admin on storage.objects for all
  using (bucket_id = 'case-files' and is_admin())
  with check (bucket_id = 'case-files' and is_admin());

create policy case_files_storage_surveyor_select on storage.objects for select
  using (
    bucket_id = 'case-files'
    and is_assigned_surveyor(split_part(name, '/', 1)::uuid)
  );

create policy case_files_storage_surveyor_insert on storage.objects for insert
  with check (
    bucket_id = 'case-files'
    and is_assigned_surveyor(split_part(name, '/', 1)::uuid)
  );

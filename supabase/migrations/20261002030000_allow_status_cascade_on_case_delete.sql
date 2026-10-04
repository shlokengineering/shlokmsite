-- Keep status history append-only, while allowing ON DELETE CASCADE to clean up
-- statuses when an administrator deletes the parent case.

create or replace function block_status_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and not exists (
    select 1 from cases where id = old.case_id
  ) then
    return old;
  end if;

  raise exception 'statuses is append-only: % is not allowed', tg_op;
end;
$$;

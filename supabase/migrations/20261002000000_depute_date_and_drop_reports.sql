-- Depute-date tracking + removal of the (non-spec) reports table. See depute.md:
--   1. `cases.deputed_date` records when a surveyor was actually deputed, independent of
--      when the deputation is entered into the system. Backfilled from the latest
--      'deputed' status row so existing cases keep their streak history.
--   2. `reports` is not part of the required schema (database.md lists 7 tables, and
--      `reports` is not one of them); drop it along with its policies.

alter table cases add column if not exists deputed_date date;

update cases c
set deputed_date = sub.status_date
from (
  select distinct on (case_id) case_id, status_date
  from statuses
  where stage = 'deputed'
  order by case_id, status_no desc
) sub
where sub.case_id = c.id and c.deputed_date is null;

drop table if exists reports cascade;

-- Motor-insurance workflow update (see motorinsurance.md):
--   1. Simplify the case lifecycle to 9 stages. Visit progress is now tracked exclusively via the
--      `visits` table (visit_scheduled/visit_done are dropped), and the ad-hoc accepted/rejected
--      sub-stages are folded back into `deputed`.
--   2. Add a site_address column to `visits` so a visit records where it took place.

begin;

-- Remap any existing rows using stages that are being retired, so the new CHECK constraint
-- below doesn't fail against data created under the previous lifecycle.
-- This is a one-time schema migration. Temporarily remove the append-only update
-- trigger created by the initial migration, then restore it immediately afterwards.
drop trigger if exists statuses_block_update on statuses;

alter table statuses drop constraint if exists statuses_stage_check;

update statuses set stage = 'deputed' where stage in ('accepted', 'rejected');
update statuses set stage = 'status_report_sent' where stage in ('visit_scheduled', 'visit_done');

alter table statuses add constraint statuses_stage_check check (
  stage in (
    'case_created', 'deputed', 'status_report_sent', 'call_for_document',
    'documents_pending', 'draft_report', 'under_review', 'submitted', 'closed'
  )
);

create trigger statuses_block_update
  before update on statuses
  for each row execute function block_status_mutation();

alter table visits add column if not exists site_address text;

commit;

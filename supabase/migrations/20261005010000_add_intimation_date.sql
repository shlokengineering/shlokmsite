begin;

alter table cases add column if not exists intimation_date date;

update cases c
set intimation_date = coalesce(
  (
    select s.status_date
    from statuses s
    where s.case_id = c.id and s.stage = 'case_created'
    order by s.status_no
    limit 1
  ),
  c.created_at::date
)
where c.intimation_date is null;

alter table cases alter column intimation_date set default current_date;
alter table cases alter column intimation_date set not null;

alter table statuses drop constraint if exists statuses_stage_check;
alter table statuses add constraint statuses_stage_check check (
  stage in (
    'intimated', 'case_created', 'deputed', 'status_report_sent', 'call_for_document',
    'documents_pending', 'draft_report', 'under_review', 'submitted', 'closed'
  )
);

drop trigger if exists statuses_set_no on statuses;

insert into statuses (case_id, status_no, stage, status_date, status_remarks)
select
  c.id,
  coalesce((select min(s.status_no) - 1 from statuses s where s.case_id = c.id), 0),
  'intimated',
  c.intimation_date,
  'Case intimated'
from cases c
where not exists (
  select 1 from statuses s where s.case_id = c.id and s.stage = 'intimated'
);

create trigger statuses_set_no
  before insert on statuses
  for each row execute function set_status_no();

commit;

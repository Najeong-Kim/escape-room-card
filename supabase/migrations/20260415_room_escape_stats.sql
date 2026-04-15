-- 방별 탈출 결과 기록 (성공/실패, 힌트 수, 남은 시간)
create table if not exists room_escape_stats (
  id                uuid        default gen_random_uuid() primary key,
  room_id           integer     not null,
  session_id        text        not null,
  cleared           boolean     not null,
  hints_used        smallint    null check (hints_used >= 0),
  remaining_minutes smallint    null check (remaining_minutes >= 0),
  created_at        timestamptz default now(),
  constraint room_escape_stats_unique unique (room_id, session_id)
);

alter table room_escape_stats enable row level security;

drop policy if exists "public read" on room_escape_stats;
drop policy if exists "public insert" on room_escape_stats;
drop policy if exists "public update" on room_escape_stats;

create policy "public read"   on room_escape_stats for select using (true);
create policy "public insert" on room_escape_stats for insert with check (true);
create policy "public update" on room_escape_stats for update using (true);

create index if not exists room_escape_stats_room_id_idx on room_escape_stats (room_id);

-- 집계 뷰
create or replace view room_escape_summary as
select
  room_id,
  count(*)::integer                                                                        as total_count,
  count(*) filter (where cleared)::integer                                                 as cleared_count,
  round(
    count(*) filter (where cleared)::numeric / nullif(count(*), 0) * 100
  )::integer                                                                               as clear_rate,
  round(
    avg(hints_used) filter (where cleared and hints_used is not null), 1
  )                                                                                        as avg_hints_cleared,
  round(
    avg(remaining_minutes) filter (where cleared and remaining_minutes is not null)
  )::integer                                                                               as avg_remaining_minutes_cleared
from room_escape_stats
group by room_id;

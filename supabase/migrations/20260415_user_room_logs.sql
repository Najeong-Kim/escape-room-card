-- Per-user play logs for logged-in accounts.
create table if not exists user_room_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  local_id          text not null,
  room_id           integer not null,
  room_name         text not null,
  brand             text not null,
  played_at         date not null,
  cleared           boolean not null,
  hints_used        smallint check (hints_used is null or hints_used >= 0),
  remaining_minutes smallint check (remaining_minutes is null or remaining_minutes >= 0),
  rating            smallint check (rating is null or rating between 0 and 5),
  difficulty_score  numeric check (difficulty_score is null or difficulty_score between 0 and 10),
  fear_score        numeric check (fear_score is null or fear_score between 0 and 10),
  activity_score    numeric check (activity_score is null or activity_score between 0 and 10),
  story_score       numeric check (story_score is null or story_score between 0 and 10),
  interior_score    numeric check (interior_score is null or interior_score between 0 and 10),
  aging_score       numeric check (aging_score is null or aging_score between 0 and 10),
  memo              text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint user_room_logs_user_local_unique unique (user_id, local_id)
);

create index if not exists user_room_logs_user_id_idx on user_room_logs(user_id);
create index if not exists user_room_logs_room_id_idx on user_room_logs(room_id);

drop trigger if exists user_room_logs_set_updated_at on user_room_logs;
create trigger user_room_logs_set_updated_at
before update on user_room_logs
for each row execute function set_updated_at();

alter table user_room_logs enable row level security;

drop policy if exists "users read own room logs" on user_room_logs;
drop policy if exists "users insert own room logs" on user_room_logs;
drop policy if exists "users update own room logs" on user_room_logs;
drop policy if exists "users delete own room logs" on user_room_logs;

create policy "users read own room logs" on user_room_logs
for select using (auth.uid() = user_id);

create policy "users insert own room logs" on user_room_logs
for insert with check (auth.uid() = user_id);

create policy "users update own room logs" on user_room_logs
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users delete own room logs" on user_room_logs
for delete using (auth.uid() = user_id);

-- Anonymous user ratings for detailed theme metrics.
create table if not exists room_metric_ratings (
  id               uuid        default gen_random_uuid() primary key,
  room_id          integer     not null,
  session_id       text        not null,
  difficulty_score smallint    check (difficulty_score is null or (difficulty_score >= 0 and difficulty_score <= 10)),
  fear_score       smallint    check (fear_score is null or (fear_score >= 0 and fear_score <= 10)),
  activity_score   smallint    check (activity_score is null or (activity_score >= 0 and activity_score <= 10)),
  story_score      smallint    check (story_score is null or (story_score >= 0 and story_score <= 10)),
  interior_score   smallint    check (interior_score is null or (interior_score >= 0 and interior_score <= 10)),
  aging_score      smallint    check (aging_score is null or (aging_score >= 0 and aging_score <= 10)),
  created_at       timestamptz default now(),
  constraint room_metric_ratings_unique unique (room_id, session_id)
);

alter table room_metric_ratings enable row level security;

create policy "public read room metric ratings" on room_metric_ratings
for select using (true);

create policy "public insert room metric ratings" on room_metric_ratings
for insert with check (true);

create policy "public update room metric ratings" on room_metric_ratings
for update using (true);

create or replace view room_metric_rating_stats as
  select
    room_id,
    round(avg(difficulty_score)::numeric, 1) as difficulty_score,
    count(difficulty_score)::integer as difficulty_count,
    round(avg(fear_score)::numeric, 1) as fear_score,
    count(fear_score)::integer as fear_count,
    round(avg(activity_score)::numeric, 1) as activity_score,
    count(activity_score)::integer as activity_count,
    round(avg(story_score)::numeric, 1) as story_score,
    count(story_score)::integer as story_count,
    round(avg(interior_score)::numeric, 1) as interior_score,
    count(interior_score)::integer as interior_count,
    round(avg(aging_score)::numeric, 1) as aging_score,
    count(aging_score)::integer as aging_count
  from room_metric_ratings
  group by room_id;

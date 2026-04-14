-- 익명 유저 방 평가 테이블
create table if not exists room_ratings (
  id           uuid        default gen_random_uuid() primary key,
  room_id      integer     not null,
  rating       smallint    not null check (rating >= 0 and rating <= 5),
  session_id   text        not null,
  created_at   timestamptz default now(),
  -- 같은 익명 유저가 같은 방을 여러 번 평가하면 upsert
  constraint room_ratings_unique unique (room_id, session_id)
);

-- RLS 활성화
alter table room_ratings enable row level security;

-- 누구나 읽기/쓰기 가능 (익명 앱)
create policy "public read"   on room_ratings for select using (true);
create policy "public insert" on room_ratings for insert with check (true);
create policy "public update" on room_ratings for update using (true);

-- 집계 뷰: room_id 별 평균(0-5) → score_10 (0-10, 소수 1자리)
create or replace view room_rating_stats as
  select
    room_id,
    round(avg(rating)::numeric * 2, 1) as score_10,
    count(*)::integer                  as rating_count
  from room_ratings
  group by room_id;

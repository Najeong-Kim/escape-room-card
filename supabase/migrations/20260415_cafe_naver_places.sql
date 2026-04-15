-- Store verified Naver place links per cafe.
alter table cafes
add column if not exists naver_place_id text,
add column if not exists naver_place_url text,
add column if not exists naver_place_name text,
add column if not exists naver_place_address text,
add column if not exists naver_place_checked_at timestamptz;

create index if not exists cafes_naver_place_id_idx on cafes(naver_place_id);

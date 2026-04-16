-- Latest escape room card profile per signed-in user.
create table if not exists user_card_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  nickname      text not null,
  fear_level    text not null check (fear_level in ('brave', 'calm', 'cautious')),
  puzzle_style  text not null check (puzzle_style in ('puzzle', 'device', 'balanced')),
  character_id  text not null check (character_id in (
    'brave_puzzle',
    'brave_device',
    'brave_balanced',
    'neutral_puzzle',
    'neutral_device',
    'neutral_balanced',
    'scared_any'
  )),
  tagline       text not null,
  play_count    text not null,
  genres        text[] not null default '{}',
  play_style    text[] not null default '{}',
  profile       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists user_card_profiles_character_id_idx
on user_card_profiles(character_id);

drop trigger if exists user_card_profiles_set_updated_at on user_card_profiles;
create trigger user_card_profiles_set_updated_at
before update on user_card_profiles
for each row execute function set_updated_at();

alter table user_card_profiles enable row level security;

drop policy if exists "users read own card profile" on user_card_profiles;
drop policy if exists "users insert own card profile" on user_card_profiles;
drop policy if exists "users update own card profile" on user_card_profiles;
drop policy if exists "users delete own card profile" on user_card_profiles;

create policy "users read own card profile" on user_card_profiles
for select using (auth.uid() = user_id);

create policy "users insert own card profile" on user_card_profiles
for insert with check (auth.uid() = user_id);

create policy "users update own card profile" on user_card_profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users delete own card profile" on user_card_profiles
for delete using (auth.uid() = user_id);

create or replace function get_similar_profile_favorite_themes(
  p_character_id text,
  p_limit integer default 3
)
returns table (
  theme_id bigint,
  name text,
  brand text,
  location text,
  image_url text,
  genre_labels text[],
  liked_count integer,
  score_10 numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with liked as (
    select
      logs.room_id,
      count(distinct logs.user_id)::integer as liked_count,
      round(avg(logs.rating)::numeric * 2, 1) as score_10
    from user_room_logs logs
    join user_card_profiles profiles on profiles.user_id = logs.user_id
    where profiles.character_id = p_character_id
      and logs.rating >= 4
      and (auth.uid() is null or logs.user_id <> auth.uid())
    group by logs.room_id
  )
  select
    themes.id as theme_id,
    themes.name,
    concat_ws(' ', cafes.name, cafes.branch_name) as brand,
    coalesce(areas.name, cafes.area_label) as location,
    case when themes.image_status = 'rejected' then null else themes.image_url end as image_url,
    coalesce(array_agg(distinct genres.code) filter (where genres.code is not null), '{}') as genre_labels,
    liked.liked_count,
    liked.score_10
  from liked
  join themes on themes.id = liked.room_id
  join cafes on cafes.id = themes.cafe_id
  left join areas on areas.id = cafes.area_id
  left join theme_genres on theme_genres.theme_id = themes.id
  left join genres on genres.id = theme_genres.genre_id
  where themes.status = 'active'
    and themes.needs_review = false
    and cafes.status = 'active'
    and cafes.needs_review = false
  group by
    themes.id,
    themes.name,
    themes.image_status,
    themes.image_url,
    cafes.name,
    cafes.branch_name,
    cafes.area_label,
    areas.name,
    liked.liked_count,
    liked.score_10
  order by liked.liked_count desc, liked.score_10 desc, themes.id asc
  limit least(greatest(coalesce(p_limit, 3), 1), 10);
$$;

grant execute on function get_similar_profile_favorite_themes(text, integer) to anon, authenticated;

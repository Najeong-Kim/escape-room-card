create or replace function path_rating_base_score(p_rating smallint)
returns numeric
language sql
immutable
as $$
  select case p_rating
    when 0 then 3.0
    when 1 then 5.0
    when 2 then 6.3
    when 3 then 7.4
    when 4 then 8.6
    when 5 then 9.7
  end;
$$;

create or replace function adjusted_path_rating_score(
  p_base_score numeric,
  p_rating_count integer,
  p_dirt_count integer,
  p_life_count integer,
  p_global_score numeric default 6.8
)
returns numeric
language sql
immutable
as $$
  select round(least(10.0, greatest(1.0,
    p_base_score
    + case
        when p_rating_count >= 10 and p_dirt_count::numeric / p_rating_count >= 0.9 then -1.0
        when p_rating_count >= 5 and p_dirt_count::numeric / p_rating_count >= 0.7 then -0.5
        else 0
      end
    + case
        when p_rating_count >= 10 and p_life_count::numeric / p_rating_count >= 0.7 then 0.3
        when p_rating_count >= 5 and p_life_count::numeric / p_rating_count >= 0.5 then 0.2
        else 0
      end
    + case
        when p_rating_count < 3 then (coalesce(p_global_score, 6.8) - p_base_score) * 0.35
        else 0
      end
  ))::numeric, 1);
$$;

create or replace view room_rating_stats as
  with global_score as (
    select coalesce(avg(path_rating_base_score(rating)), 6.8) as score_10
    from room_ratings
  ),
  stats as (
    select
      room_id,
      avg(path_rating_base_score(rating)) as base_score,
      count(*)::integer as rating_count,
      count(*) filter (where rating = 0)::integer as dirt_count,
      count(*) filter (where rating = 5)::integer as life_count
    from room_ratings
    group by room_id
  )
  select
    stats.room_id,
    adjusted_path_rating_score(
      stats.base_score,
      stats.rating_count,
      stats.dirt_count,
      stats.life_count,
      global_score.score_10
    ) as score_10,
    stats.rating_count
  from stats
  cross join global_score;

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
  with global_score as (
    select coalesce(avg(path_rating_base_score(rating)), 6.8) as score_10
    from user_room_logs
    where rating is not null
  ),
  liked as (
    select
      logs.room_id,
      count(distinct logs.user_id)::integer as liked_count,
      adjusted_path_rating_score(
        avg(path_rating_base_score(logs.rating::smallint)),
        count(*)::integer,
        count(*) filter (where logs.rating = 0)::integer,
        count(*) filter (where logs.rating = 5)::integer,
        global_score.score_10
      ) as score_10
    from user_room_logs logs
    join user_card_profiles profiles on profiles.user_id = logs.user_id
    cross join global_score
    where profiles.character_id = p_character_id
      and logs.rating >= 4
      and (auth.uid() is null or logs.user_id <> auth.uid())
    group by logs.room_id, global_score.score_10
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

-- Colory-style public scores rarely sit in the 0-1 range, so keep the
-- stored path rating steps and convert them through an app-specific scale.
create or replace view room_rating_stats as
  select
    room_id,
    round(avg(
      case rating
        when 0 then 3.0
        when 1 then 5.0
        when 2 then 6.3
        when 3 then 7.4
        when 4 then 8.6
        when 5 then 9.7
      end
    )::numeric, 1) as score_10,
    count(*)::integer as rating_count
  from room_ratings
  group by room_id;

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
      round(avg(
        case logs.rating
          when 0 then 3.0
          when 1 then 5.0
          when 2 then 6.3
          when 3 then 7.4
          when 4 then 8.6
          when 5 then 9.7
        end
      )::numeric, 1) as score_10
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

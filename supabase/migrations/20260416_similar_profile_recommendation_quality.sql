drop function if exists get_similar_profile_favorite_themes(text, integer);

create or replace function get_similar_profile_favorite_themes(
  p_character_id text,
  p_limit integer default 3,
  p_min_liked_count integer default 2
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
  current_user_played as (
    select room_id
    from user_room_logs
    where auth.uid() is not null
      and user_id = auth.uid()
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
      and not exists (
        select 1
        from current_user_played played
        where played.room_id = logs.room_id
      )
    group by logs.room_id, global_score.score_10
    having count(distinct logs.user_id) >= greatest(coalesce(p_min_liked_count, 2), 1)
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

grant execute on function get_similar_profile_favorite_themes(text, integer, integer) to anon, authenticated;

notify pgrst, 'reload schema';

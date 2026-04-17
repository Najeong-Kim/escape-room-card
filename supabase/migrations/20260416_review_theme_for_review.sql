create or replace function review_theme_for_review(
  p_theme_id bigint,
  p_status text
)
returns table (
  theme_id bigint,
  theme_status text,
  theme_needs_review boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cafe_status text;
  v_cafe_needs_review boolean;
begin
  if p_status not in ('active', 'rejected') then
    raise exception 'Unsupported theme review status: %', p_status;
  end if;

  if p_status = 'active' then
    select cafes.status, cafes.needs_review
    into v_cafe_status, v_cafe_needs_review
    from themes
    join cafes on cafes.id = themes.cafe_id
    where themes.id = p_theme_id;

    if v_cafe_status is null then
      raise exception 'Theme % was not found', p_theme_id;
    end if;

    if v_cafe_status <> 'active' or v_cafe_needs_review is true then
      raise exception 'Cafe must be approved before approving theme %', p_theme_id;
    end if;
  end if;

  update themes
  set status = p_status,
      needs_review = false
  where id = p_theme_id
  returning id, status, needs_review
  into theme_id, theme_status, theme_needs_review;

  if theme_id is null then
    raise exception 'Theme % was not found or could not be updated', p_theme_id;
  end if;

  return next;
end;
$$;

revoke all on function review_theme_for_review(bigint, text) from public;
grant execute on function review_theme_for_review(bigint, text) to service_role;

notify pgrst, 'reload schema';

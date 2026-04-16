create or replace function close_cafe_for_review(p_cafe_id bigint)
returns table (
  cafe_id bigint,
  cafe_status text,
  cafe_needs_review boolean,
  closed_theme_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_theme_count integer := 0;
begin
  update cafes
  set status = 'closed',
      needs_review = false
  where id = p_cafe_id
  returning id, status, needs_review
  into cafe_id, cafe_status, cafe_needs_review;

  if cafe_id is null then
    raise exception 'Cafe % was not found or could not be updated', p_cafe_id;
  end if;

  update themes
  set status = 'closed',
      needs_review = false
  where themes.cafe_id = p_cafe_id;

  get diagnostics v_theme_count = row_count;

  update cafe_verification_candidates
  set status = 'dismissed'
  where cafe_verification_candidates.cafe_id = p_cafe_id;

  closed_theme_count := v_theme_count;
  return next;
end;
$$;

revoke all on function close_cafe_for_review(bigint) from public;
grant execute on function close_cafe_for_review(bigint) to service_role;

notify pgrst, 'reload schema';

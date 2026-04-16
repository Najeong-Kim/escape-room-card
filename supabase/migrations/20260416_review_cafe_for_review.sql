create or replace function review_cafe_for_review(
  p_cafe_id bigint,
  p_status text
)
returns table (
  cafe_id bigint,
  cafe_status text,
  cafe_needs_review boolean,
  affected_theme_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_theme_count integer := 0;
begin
  if p_status not in ('active', 'rejected') then
    raise exception 'Unsupported cafe review status: %', p_status;
  end if;

  update cafes
  set status = p_status,
      needs_review = false
  where id = p_cafe_id
  returning id, status, needs_review
  into cafe_id, cafe_status, cafe_needs_review;

  if cafe_id is null then
    raise exception 'Cafe % was not found or could not be updated', p_cafe_id;
  end if;

  if p_status = 'rejected' then
    update themes
    set status = 'rejected',
        needs_review = false
    where themes.cafe_id = p_cafe_id;

    get diagnostics v_theme_count = row_count;

    update cafe_verification_candidates
    set status = 'dismissed'
    where cafe_verification_candidates.cafe_id = p_cafe_id;
  end if;

  affected_theme_count := v_theme_count;
  return next;
end;
$$;

revoke all on function review_cafe_for_review(bigint, text) from public;
grant execute on function review_cafe_for_review(bigint, text) to service_role;

notify pgrst, 'reload schema';

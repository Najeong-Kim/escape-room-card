drop policy if exists "public read cafe verification candidates" on cafe_verification_candidates;
create policy "public read cafe verification candidates" on cafe_verification_candidates
for select
using (true);

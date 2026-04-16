-- Allow service role backed admin screens to manage theme tags.
drop policy if exists "service role manage theme tags" on theme_tags;
create policy "service role manage theme tags" on theme_tags
for all to service_role
using (true)
with check (true);

drop policy if exists "service role manage theme taggings" on theme_taggings;
create policy "service role manage theme taggings" on theme_taggings
for all to service_role
using (true)
with check (true);

drop policy if exists "service role manage theme tag sources" on theme_tag_sources;
create policy "service role manage theme tag sources" on theme_tag_sources
for all to service_role
using (true)
with check (true);

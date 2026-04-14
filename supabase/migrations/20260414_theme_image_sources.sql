alter table themes
add column if not exists image_source_url text,
add column if not exists image_source_name text,
add column if not exists image_status text not null default 'unverified'
  check (image_status in ('unverified', 'verified', 'rejected', 'manual'));

create index if not exists themes_image_status_idx on themes(image_status);

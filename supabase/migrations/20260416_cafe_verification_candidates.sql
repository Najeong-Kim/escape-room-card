create table if not exists cafe_verification_candidates (
  id                uuid primary key default gen_random_uuid(),
  cafe_id           bigint not null references cafes(id) on delete cascade,
  provider          text not null default 'naver-local',
  query             text not null,
  status            text not null default 'pending'
    check (status in ('pending', 'applied', 'dismissed')),
  confidence        text not null default 'manual'
    check (confidence in ('high', 'manual')),
  score             integer,
  best_candidate    jsonb,
  candidates        jsonb not null default '[]'::jsonb,
  suggested_changes jsonb not null default '{}'::jsonb,
  generated_at      timestamptz not null default now(),
  applied_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint cafe_verification_candidates_cafe_provider_unique unique (cafe_id, provider)
);

drop trigger if exists cafe_verification_candidates_set_updated_at on cafe_verification_candidates;
create trigger cafe_verification_candidates_set_updated_at
before update on cafe_verification_candidates
for each row execute function set_updated_at();

alter table cafe_verification_candidates enable row level security;

drop policy if exists "service role manage cafe verification candidates" on cafe_verification_candidates;
create policy "service role manage cafe verification candidates" on cafe_verification_candidates
for all to service_role
using (true)
with check (true);

create index if not exists cafe_verification_candidates_cafe_id_idx
on cafe_verification_candidates(cafe_id);

create index if not exists cafe_verification_candidates_status_idx
on cafe_verification_candidates(status);

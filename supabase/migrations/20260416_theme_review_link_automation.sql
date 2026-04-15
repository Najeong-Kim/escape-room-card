-- Automation metadata for externally collected theme review links.

alter table theme_review_links
drop constraint if exists theme_review_links_status_check;

alter table theme_review_links
add constraint theme_review_links_status_check
check (status in ('active', 'pending', 'hidden', 'rejected'));

alter table theme_review_links
add column if not exists confidence_score integer,
add column if not exists match_reason text[] not null default '{}',
add column if not exists collected_by text not null default 'manual',
add column if not exists raw_payload jsonb not null default '{}'::jsonb;

alter table theme_review_links
drop constraint if exists theme_review_links_confidence_score_check;

alter table theme_review_links
add constraint theme_review_links_confidence_score_check
check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100));

create index if not exists theme_review_links_confidence_score_idx
on theme_review_links(confidence_score);

create index if not exists theme_review_links_collected_by_idx
on theme_review_links(collected_by);

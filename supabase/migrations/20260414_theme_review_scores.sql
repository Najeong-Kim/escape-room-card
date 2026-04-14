-- Review score fields for theme display and filtering.
-- Scores use a 0-10 scale; *_label keeps the source text when available.

alter table themes
add column if not exists difficulty_score numeric(3,1)
  check (difficulty_score is null or (difficulty_score >= 0 and difficulty_score <= 10)),
add column if not exists fear_score numeric(3,1)
  check (fear_score is null or (fear_score >= 0 and fear_score <= 10)),
add column if not exists activity_label text,
add column if not exists activity_score numeric(3,1)
  check (activity_score is null or (activity_score >= 0 and activity_score <= 10)),
add column if not exists story_label text,
add column if not exists story_score numeric(3,1)
  check (story_score is null or (story_score >= 0 and story_score <= 10)),
add column if not exists interior_label text,
add column if not exists interior_score numeric(3,1)
  check (interior_score is null or (interior_score >= 0 and interior_score <= 10)),
add column if not exists aging_label text,
add column if not exists aging_score numeric(3,1)
  check (aging_score is null or (aging_score >= 0 and aging_score <= 10));

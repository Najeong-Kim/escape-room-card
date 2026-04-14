# Gangnam Theme Import

This is the first-pass workflow for importing Seoul Gangnam-gu escape room cafes and themes.

## Scope

- Region: Seoul, Gangnam-gu
- Data shape: public listing fields only
- Excluded for now: subjective recommendation fields such as fear level, puzzle weight, difficulty score, interior score, and app ranking score
- Review status: every imported row starts with `needs_review=true`

## Files

- `supabase/migrations/20260414_cafes_themes.sql`: creates `cafes`, `themes`, and `theme_sources`
- `data/gangnam-gu-themes.seed.json`: bootstrap Gangnam-gu seed data
- `scripts/import-gangnam-themes.mjs`: upserts the seed into Supabase

## Run Order

1. Apply the migration SQL in Supabase SQL Editor.
2. Run:

```bash
npm run import:gangnam-themes
```

3. Review imported rows in Supabase:

```sql
select * from cafes where district = '강남구' order by name, branch_name;
select t.*, c.name as cafe_name, c.branch_name
from themes t
join cafes c on c.id = t.cafe_id
where c.district = '강남구'
order by c.name, c.branch_name, t.name;
```

4. Verify official source URLs and set `needs_review=false` only after confirmation.

## Minimum Display Fields

For cafes:

- `name`
- `branch_name`
- `area_label`
- `district`
- `address`
- `website_url`
- `booking_url`
- `status`

For themes:

- `name`
- `genre_labels`
- `duration_minutes`
- `min_players`
- `max_players`
- `price_text`
- `price_per_person`
- `image_url`
- `booking_url`
- `status`

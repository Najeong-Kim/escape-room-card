update themes
set
  fear_label = regexp_replace(fear_label, '\s*/\s*10\s*$', ' / 5'),
  fear_score = round((substring(fear_label from '^\s*([0-9]+(?:\.[0-9]+)?)')::numeric * 2)::numeric, 1),
  updated_at = now()
where fear_label ~ '^\s*[0-5](?:\.[0-9]+)?\s*/\s*10\s*$'
  and substring(fear_label from '^\s*([0-9]+(?:\.[0-9]+)?)')::numeric <= 5;

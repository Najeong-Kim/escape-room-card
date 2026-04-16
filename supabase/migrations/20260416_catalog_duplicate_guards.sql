-- Guard future imports from creating duplicate cafes when a Naver place is known.
create unique index if not exists cafes_naver_place_id_unique_idx
on cafes(naver_place_id)
where naver_place_id is not null and naver_place_id <> '';

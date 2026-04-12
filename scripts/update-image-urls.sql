-- Update image_url for all rooms based on genre mapping
-- Run this in Supabase SQL Editor: https://app.supabase.com → SQL Editor → New query
--
-- Genre → Character mapping:
--   Horror + MysteryThriller → wolf
--   Horror                   → tiger
--   MysteryThriller          → fox
--   Emotional                → cat
--   Comic                    → rabbit
--   FantasyAdventure         → eagle
--   Mixed / other            → lion

UPDATE rooms SET image_url = CASE
  WHEN array_to_string(genres::text[], ',') LIKE '%Horror%'
   AND array_to_string(genres::text[], ',') LIKE '%MysteryThriller%'
    THEN '/characters/wolf.png'
  WHEN array_to_string(genres::text[], ',') LIKE '%Horror%'
    THEN '/characters/tiger.png'
  WHEN array_to_string(genres::text[], ',') LIKE '%MysteryThriller%'
    THEN '/characters/fox.png'
  WHEN array_to_string(genres::text[], ',') LIKE '%Emotional%'
    THEN '/characters/cat.png'
  WHEN array_to_string(genres::text[], ',') LIKE '%Comic%'
    THEN '/characters/rabbit.png'
  WHEN array_to_string(genres::text[], ',') LIKE '%FantasyAdventure%'
    THEN '/characters/eagle.png'
  ELSE '/characters/lion.png'
END;

-- Verify results
SELECT name, genres, image_url FROM rooms ORDER BY name;

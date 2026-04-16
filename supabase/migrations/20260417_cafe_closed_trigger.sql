-- Automatically close all themes when a cafe is marked as closed
create or replace function close_cafe_themes()
returns trigger
language plpgsql
as $$
begin
  if NEW.status = 'closed' and OLD.status != 'closed' then
    update themes set status = 'closed' where cafe_id = NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists cafe_closed_close_themes on cafes;
create trigger cafe_closed_close_themes
after update on cafes
for each row
execute function close_cafe_themes();

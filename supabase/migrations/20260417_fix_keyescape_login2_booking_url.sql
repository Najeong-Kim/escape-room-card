update themes
set booking_url = 'https://www.keyescape.com/reservation1.php?zizum_num=20&theme_num=64&theme_info_num=42'
from cafes
where themes.cafe_id = cafes.id
  and cafes.name = '키이스케이프'
  and cafes.branch_name = '로그인2'
  and themes.name = 'A Gentle Monday';

const ko = {
  // Common
  back: '← 뒤로',
  continue: '계속하기',
  continue_arrow: '계속하기 →',
  step: '{{current}} / {{total}} 단계',
  lang_toggle: 'English',

  // Nickname step
  nickname_title: '닉네임이 뭔가요?',
  nickname_subtitle: '방탈출 카드에 표시됩니다',
  nickname_placeholder: '닉네임을 입력하세요',

  // Questions
  q_play_count: '방탈출을 몇 번이나 해봤나요?',
  q_fear_q1: '어두운 방 뒤에서 갑자기 소리가 들립니다.',
  q_fear_q2: '혼자 어두운 복도를 걸어가야 합니다.',
  q_genre: '좋아하는 장르를 선택하세요',
  q_puzzle_q1: '뭔가 열리지 않을 때, 당신은...',
  q_puzzle_q2: '더 만족스러운 것은?',
  q_play_style: '어떻게 플레이하나요?',

  // Multi-select hints
  pick_up_to: '최대 {{max}}개 선택',
  max_selected: '최대 {{max}}개 선택됨',

  // Options — play count
  'opt_0-10': '0 ~ 10번',
  'opt_10-30': '10 ~ 30번',
  'opt_30-100': '30 ~ 100번',
  'opt_100+': '100번 이상',

  // Options — fear Q1
  opt_react: '즉시 반응한다',
  opt_freeze: '얼어붙는다',
  opt_ignore: '무시하고 계속한다',

  // Options — fear Q2
  opt_cannot: '못 간다',
  opt_someone: '누군가 있으면 갈 수 있다',
  opt_alone: '혼자서도 갈 수 있다',

  // Options — genre
  opt_Horror: '공포',
  opt_Mystery: '미스터리',
  opt_Fantasy: '판타지',
  opt_Emotional: '감성',
  opt_Thriller: '스릴러',

  // Options — puzzle
  opt_surroundings: '주변을 탐색해 트리거 찾기',
  opt_puzzles: '앞에 있는 퍼즐 풀기',
  opt_solving: '퍼즐 풀기',
  opt_triggering: '장치 작동시키기',

  // Options — play style
  'opt_No-hint player': '힌트 없이 플레이',
  'opt_Speed runner': '스피드런',
  opt_Cooperative: '협동형',
  opt_Observer: '관찰자',

  // Result card UI
  result_subtitle: '나의 방탈출 카드',
  tap_to_flip: '탭해서 뒤집기',
  try_again: '다시 하기',
  save_card: '💾 카드 저장',
  preparing: '⏳ 준비 중...',
  card_details: '카드 상세',
  label_fear: '공포 레벨',
  label_style: '스타일',
  label_genres: '장르',
  label_play_style: '플레이 스타일',
  label_experience: '경험',
  rooms_count: '{{count}}번',
  watermark: '🔒 방탈출 카드',

  // Taglines
  tagline_brave_puzzle: '용감한 퍼즐 마스터',
  tagline_brave_device: '용감한 장치 전문가',
  tagline_brave_balanced: '용감한 전략가',
  tagline_neutral_puzzle: '침착한 퍼즐 마스터',
  tagline_neutral_device: '침착한 장치 전문가',
  tagline_neutral_balanced: '침착한 전략가',
  tagline_scared_any: '신중한 관찰자',

  // Fear / style display
  fear_brave: '용감함',
  fear_calm: '침착함',
  fear_cautious: '신중함',
  style_puzzle: '퍼즐',
  style_device: '장치',
  style_balanced: '균형',

  // Tiers
  tier_Beginner: '입문자',
  tier_Regular: '일반인',
  tier_Veteran: '베테랑',
  tier_Expert: '전문가',
} as const

export default ko

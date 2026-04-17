const en = {
  // Common
  back: '← Back',
  continue: 'Continue',
  continue_arrow: 'Continue →',
  skip: 'Skip',
  step: 'Step {{current}} / {{total}}',
  lang_toggle: '한국어',

  // Nickname step
  nickname_title: "What's your nickname?",
  nickname_subtitle: 'This will appear on your escape room card',
  nickname_placeholder: 'Enter your nickname',

  // Questions
  q_play_count: 'How many escape rooms have you done?',
  q_fear_q1: 'You hear a sudden noise behind you in a dark room.',
  q_fear_q2: 'You have to walk alone through a dark hallway.',
  q_genre: 'Which genres do you love?',
  q_puzzle_q1: "When something doesn't open, you...",
  q_puzzle_q2: 'What feels more satisfying?',
  q_play_style: 'How do you play?',

  // Multi-select hints
  pick_up_to: 'Pick up to {{max}}',
  max_selected: 'Max {{max}} selected',

  // Options — play count
  'opt_0-10': '0 – 10 rooms',
  'opt_10-30': '10 – 30 rooms',
  'opt_30-100': '30 – 100 rooms',
  'opt_100+': '100+ rooms',

  // Options — fear Q1
  opt_react: 'React immediately',
  opt_freeze: 'Freeze',
  opt_ignore: 'Ignore and continue',

  // Options — fear Q2
  opt_cannot: "Can't go",
  opt_someone: "Can go if someone's with me",
  opt_alone: 'Can go alone',

  // Options — genre
  opt_Horror: 'Horror',
  opt_MysteryThriller: 'Mystery / Thriller',
  opt_Emotional: 'Emotional / Drama',
  opt_Comic: 'Comic',
  opt_FantasyAdventure: 'Fantasy / Adventure',
  opt_Crime: 'Crime / Infiltration',
  opt_SF: 'SF',

  // Options — puzzle
  opt_surroundings: 'Search surroundings for a trigger',
  opt_puzzles: 'Solve the puzzle in front of me',
  opt_solving: 'Solving a puzzle',
  opt_triggering: 'Triggering a mechanism',

  // Options — play style
  'opt_No-hint player': 'No-hint player',
  'opt_Speed runner': 'Speed runner',
  opt_Cooperative: 'Cooperative',
  opt_Observer: 'Observer',

  // Result card UI
  result_subtitle: 'Your Bangtang card',
  tap_to_flip: 'Tap card to flip',
  try_again: 'Try again',
  save_card: '💾 Save Card',
  preparing: '⏳ Preparing...',
  card_details: 'Card Details',
  label_fear: 'Fear level',
  label_style: 'Style',
  label_genres: 'Genres',
  label_play_style: 'Play style',
  label_experience: 'Experience',
  rooms_count: '{{count}} rooms',
  watermark: '🔒 Bangtang',

  // Recommendations
  rec_title: 'Top 3 Picks For You',
  rec_subtitle: 'Matched to your taste',
  rec_location: 'Location',

  // Taglines
  tagline_brave_puzzle: 'Brave Puzzle Solver',
  tagline_brave_device: 'Brave Device Tinkerer',
  tagline_brave_balanced: 'Brave Strategist',
  tagline_neutral_puzzle: 'Calm Puzzle Solver',
  tagline_neutral_device: 'Calm Device Tinkerer',
  tagline_neutral_balanced: 'Calm Strategist',
  tagline_scared_any: 'Cautious Observer',

  // Fear / style display
  fear_brave: 'Brave',
  fear_calm: 'Calm',
  fear_cautious: 'Cautious',
  style_puzzle: 'Puzzle',
  style_device: 'Device',
  style_balanced: 'Balanced',

  // Tiers
  tier_Newbie: 'Newbie',
  tier_Beginner: 'Beginner',
  tier_Regular: 'Regular',
  tier_Veteran: 'Veteran',
  tier_Expert: 'Expert',
} as const

export default en

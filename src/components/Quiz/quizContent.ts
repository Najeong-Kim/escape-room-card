// All question copy in one place — easy to edit without touching logic

export const PLAY_COUNT_OPTIONS = [
  { value: '0',      label: '0 rooms',       emoji: '🐣' },
  { value: '0-10',   label: '1 – 10 rooms',  emoji: '🌱' },
  { value: '10-30',  label: '10 – 30 rooms', emoji: '🔑' },
  { value: '30-100', label: '30 – 100 rooms',emoji: '⚔️' },
  { value: '100+',   label: '100+ rooms',    emoji: '👑' },
]

export const FEAR_Q1_OPTIONS = [
  { value: 'react',  label: 'React immediately', emoji: '⚡' },
  { value: 'freeze', label: 'Freeze',             emoji: '🧊' },
  { value: 'ignore', label: 'Ignore and continue',emoji: '😎' },
]

export const FEAR_Q2_OPTIONS = [
  { value: 'cannot',  label: "I can't go",                emoji: '😰' },
  { value: 'someone', label: 'I can go if someone\'s with me', emoji: '🤝' },
  { value: 'alone',   label: 'I can go alone',             emoji: '💪' },
]

export const GENRE_OPTIONS = [
  { value: 'Horror', label: 'Horror', emoji: '👻' },
  { value: 'MysteryThriller', label: 'Mystery / Thriller', emoji: '🔍' },
  { value: 'FantasyAdventure', label: 'Fantasy / Adventure', emoji: '🗺️' },
  { value: 'Emotional', label: 'Emotional', emoji: '💭' },
  { value: 'Comic', label: 'Comic', emoji: '🎈' },
]

export const PUZZLE_Q1_OPTIONS = [
  { value: 'surroundings', label: 'Search the surroundings for a trigger', emoji: '👁️' },
  { value: 'puzzles',      label: 'Solve the puzzle in front of me',       emoji: '🧩' },
]

export const PUZZLE_Q2_OPTIONS = [
  { value: 'solving',    label: 'Solving a puzzle',           emoji: '🧠' },
  { value: 'triggering', label: 'Triggering a mechanism',     emoji: '⚙️' },
]

export const PLAY_STYLE_OPTIONS = [
  { value: 'No-hint player', label: 'No-hint player', emoji: '🚫' },
  { value: 'Speed runner',   label: 'Speed runner',   emoji: '⏱️' },
  { value: 'Cooperative',    label: 'Cooperative',    emoji: '🤜' },
  { value: 'Observer',       label: 'Observer',       emoji: '🎭' },
]

// Game data for generating puzzles

export const WORDS = {
  common: [
    'apple', 'beach', 'chair', 'dance', 'eagle', 'flame', 'grape', 'house',
    'image', 'juice', 'knife', 'lemon', 'music', 'night', 'ocean', 'piano',
    'queen', 'river', 'stone', 'tiger', 'unity', 'vivid', 'water', 'xenon',
    'youth', 'zebra', 'actor', 'blaze', 'crane', 'drift', 'ember', 'frost',
    'giant', 'honey', 'ivory', 'jolly', 'karma', 'lunar', 'maple', 'noble',
    'orbit', 'pearl', 'quest', 'realm', 'spark', 'trace', 'urban', 'vigor',
    'whirl', 'yacht', 'zesty', 'amber', 'bloom', 'crest', 'dwell', 'epoch',
    'flora', 'gleam', 'haven', 'inlet', 'jewel', 'kneel', 'lotus', 'marsh',
    'oasis', 'prism', 'quilt', 'ridge', 'shade', 'thorn', 'ultra', 'valve',
    'woven', 'oxide', 'yield', 'zonal', 'arrow', 'brave', 'cloud', 'dream',
  ],
  four: [
    'able', 'back', 'call', 'dark', 'each', 'face', 'game', 'half', 'idea',
    'join', 'keep', 'last', 'made', 'name', 'once', 'part', 'race', 'same',
    'take', 'upon', 'very', 'walk', 'year', 'zero', 'blue', 'calm', 'deep',
    'edge', 'fire', 'gold', 'hope', 'iron', 'jump', 'kind', 'life', 'moon',
    'next', 'open', 'pure', 'rain', 'self', 'true', 'unit', 'view', 'warm',
    'zone', 'arch', 'bold', 'core', 'dawn', 'echo', 'flow', 'glow', 'haze',
  ],
};

export const COLORS = {
  primary: [
    { name: 'Red', hex: '#ef4444', emoji: '🔴' },
    { name: 'Blue', hex: '#3b82f6', emoji: '🔵' },
    { name: 'Green', hex: '#22c55e', emoji: '🟢' },
    { name: 'Yellow', hex: '#eab308', emoji: '🟡' },
    { name: 'Purple', hex: '#a855f7', emoji: '🟣' },
    { name: 'Orange', hex: '#f97316', emoji: '🟠' },
  ],
  extended: [
    { name: 'Pink', hex: '#ec4899', emoji: '🩷' },
    { name: 'Cyan', hex: '#06b6d4', emoji: '🩵' },
    { name: 'Lime', hex: '#84cc16', emoji: '🟩' },
    { name: 'Indigo', hex: '#6366f1', emoji: '💜' },
    { name: 'Amber', hex: '#f59e0b', emoji: '🟧' },
    { name: 'Teal', hex: '#14b8a6', emoji: '💚' },
  ],
};

export const SHAPES = {
  basic: [
    { name: 'Circle', symbol: '●', outline: '○' },
    { name: 'Square', symbol: '■', outline: '□' },
    { name: 'Triangle', symbol: '▲', outline: '△' },
    { name: 'Diamond', symbol: '◆', outline: '◇' },
    { name: 'Star', symbol: '★', outline: '☆' },
    { name: 'Heart', symbol: '♥', outline: '♡' },
  ],
  extended: [
    { name: 'Pentagon', symbol: '⬠', outline: '⬡' },
    { name: 'Hexagon', symbol: '⬢', outline: '⬣' },
    { name: 'Cross', symbol: '✚', outline: '✛' },
    { name: 'Moon', symbol: '●', outline: '☾' },
    { name: 'Arrow', symbol: '➤', outline: '➢' },
    { name: 'Spade', symbol: '♠', outline: '♤' },
  ],
};

export const PATTERNS = {
  sequences: [
    [1, 2, 3, 4, 5], // arithmetic +1
    [2, 4, 6, 8, 10], // arithmetic +2
    [1, 2, 4, 8, 16], // geometric *2
    [1, 1, 2, 3, 5], // fibonacci
    [1, 4, 9, 16, 25], // squares
    [3, 6, 9, 12, 15], // arithmetic +3
    [1, 3, 6, 10, 15], // triangular
    [2, 3, 5, 7, 11], // primes
  ],
  visual: [
    ['○', '●', '○', '●', '○'],
    ['□', '□', '■', '□', '□'],
    ['△', '▽', '△', '▽', '△'],
    ['◇', '◆', '◆', '◇', '◆'],
    ['☆', '★', '☆', '★', '★'],
  ],
};

export const EMOJIS = {
  results: {
    correct: '🟩',
    partial: '🟨',
    wrong: '⬛',
    skipped: '⬜',
    star: '⭐',
    time: '⏱️',
    moves: '🎯',
  },
};

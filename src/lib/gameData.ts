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

export const EMOJI = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥝', '🍅'],
  objects: ['⭐', '🌙', '☀️', '⚡', '🔥', '💧', '🌸', '🍀', '🎈', '🎁', '💎', '🔔'],
  faces: ['😀', '😎', '🥳', '😴', '🤔', '😱', '🥶', '🤯', '😇', '🤩', '😏', '🙃'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🏸', '🥊', '⛳', '🎯'],
};

export const DIRECTIONS = {
  cardinal: [
    { name: 'Up', symbol: '↑', key: 'ArrowUp' },
    { name: 'Down', symbol: '↓', key: 'ArrowDown' },
    { name: 'Left', symbol: '←', key: 'ArrowLeft' },
    { name: 'Right', symbol: '→', key: 'ArrowRight' },
  ],
  diagonal: [
    { name: 'Up-Left', symbol: '↖', key: 'q' },
    { name: 'Up-Right', symbol: '↗', key: 'e' },
    { name: 'Down-Left', symbol: '↙', key: 'z' },
    { name: 'Down-Right', symbol: '↘', key: 'c' },
  ],
  all: [
    { name: 'Up', symbol: '↑', key: 'ArrowUp' },
    { name: 'Down', symbol: '↓', key: 'ArrowDown' },
    { name: 'Left', symbol: '←', key: 'ArrowLeft' },
    { name: 'Right', symbol: '→', key: 'ArrowRight' },
    { name: 'Up-Left', symbol: '↖', key: 'q' },
    { name: 'Up-Right', symbol: '↗', key: 'e' },
    { name: 'Down-Left', symbol: '↙', key: 'z' },
    { name: 'Down-Right', symbol: '↘', key: 'c' },
  ],
};

export const MATH = {
  operations: ['+', '-', '×', '÷'],
  simple: [
    { expression: '2 + 3', answer: 5 },
    { expression: '7 - 4', answer: 3 },
    { expression: '3 × 4', answer: 12 },
    { expression: '12 ÷ 3', answer: 4 },
    { expression: '5 + 8', answer: 13 },
    { expression: '15 - 9', answer: 6 },
    { expression: '6 × 7', answer: 42 },
    { expression: '20 ÷ 5', answer: 4 },
    { expression: '9 + 6', answer: 15 },
    { expression: '18 - 7', answer: 11 },
  ],
  medium: [
    { expression: '12 + 15', answer: 27 },
    { expression: '34 - 19', answer: 15 },
    { expression: '8 × 9', answer: 72 },
    { expression: '56 ÷ 8', answer: 7 },
    { expression: '25 + 37', answer: 62 },
    { expression: '81 - 45', answer: 36 },
    { expression: '11 × 11', answer: 121 },
    { expression: '144 ÷ 12', answer: 12 },
  ],
  sequences: [
    { sequence: [2, 4, 6, 8], next: 10, rule: '+2' },
    { sequence: [1, 3, 9, 27], next: 81, rule: '×3' },
    { sequence: [100, 90, 80, 70], next: 60, rule: '-10' },
    { sequence: [1, 4, 9, 16], next: 25, rule: 'n²' },
    { sequence: [2, 6, 18, 54], next: 162, rule: '×3' },
    { sequence: [1, 1, 2, 3, 5], next: 8, rule: 'fib' },
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

// Core game composition types
export type Mechanic = 'guess' | 'match' | 'remember' | 'react' | 'arrange' | 'deduce' | 'trace' | 'hunt' | 'stack' | 'dodge' | 'chase' | 'bounce';
export type Element = 'words' | 'colors' | 'shapes' | 'numbers' | 'patterns' | 'emoji' | 'directions' | 'math';
export type Constraint = 'attempts' | 'time' | 'sequence' | 'grid' | 'streak' | 'precision' | 'survival' | 'laps';
export type Modifier = 'hidden' | 'inverted' | 'chained' | 'speed' | 'mirrored' | 'blind' | 'zen' | 'chaos' | 'turbo' | 'gravity';

export interface GameConfig {
  mechanic: Mechanic;
  element: Element;
  constraint: Constraint;
  modifier?: Modifier;
  seed: number;
  difficulty: number; // 1-5
}

export interface GameState {
  config: GameConfig;
  started: boolean;
  completed: boolean;
  won: boolean;
  score: number;
  maxScore: number;
  attempts: number;
  maxAttempts: number;
  timeElapsed: number;
  timeLimit?: number;
  moves: GameMove[];
  data: Record<string, unknown>;
}

export interface GameMove {
  type: string;
  value: unknown;
  timestamp: number;
  correct?: boolean;
}

export interface GameResult {
  seed: number;
  config: GameConfig;
  won: boolean;
  score: number;
  maxScore: number;
  attempts: number;
  maxAttempts: number;
  timeElapsed: number;
  date: string;
  shareText: string;
}

export interface DailyProgress {
  seed: number;
  date: string;
  state: GameState;
  result?: GameResult;
}

// Game descriptions for UI
export const MECHANIC_NAMES: Record<Mechanic, string> = {
  guess: 'Guess',
  match: 'Match',
  remember: 'Remember',
  react: 'React',
  arrange: 'Arrange',
  deduce: 'Deduce',
  trace: 'Trace',
  hunt: 'Hunt',
  stack: 'Stack',
  dodge: 'Dodge',
  chase: 'Chase',
  bounce: 'Bounce',
};

export const ELEMENT_NAMES: Record<Element, string> = {
  words: 'Words',
  colors: 'Colors',
  shapes: 'Shapes',
  numbers: 'Numbers',
  patterns: 'Patterns',
  emoji: 'Emoji',
  directions: 'Directions',
  math: 'Math',
};

export const CONSTRAINT_NAMES: Record<Constraint, string> = {
  attempts: 'Limited Tries',
  time: 'Time Trial',
  sequence: 'In Order',
  grid: 'Grid Based',
  streak: 'Keep Streak',
  precision: 'Precision',
  survival: 'Survival',
  laps: 'Laps',
};

export const MODIFIER_NAMES: Record<Modifier, string> = {
  hidden: 'Hidden',
  inverted: 'Inverted',
  chained: 'Chained',
  speed: 'Speed',
  mirrored: 'Mirrored',
  blind: 'Blind',
  zen: 'Zen',
  chaos: 'Chaos',
  turbo: 'Turbo',
  gravity: 'Gravity',
};

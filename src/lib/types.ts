// Core game composition types
export type Mechanic = 'guess' | 'match' | 'remember' | 'react' | 'arrange' | 'deduce';
export type Element = 'words' | 'colors' | 'shapes' | 'numbers' | 'patterns';
export type Constraint = 'attempts' | 'time' | 'sequence' | 'grid';
export type Modifier = 'hidden' | 'inverted' | 'chained' | 'speed';

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
};

export const ELEMENT_NAMES: Record<Element, string> = {
  words: 'Words',
  colors: 'Colors',
  shapes: 'Shapes',
  numbers: 'Numbers',
  patterns: 'Patterns',
};

export const CONSTRAINT_NAMES: Record<Constraint, string> = {
  attempts: 'Limited Tries',
  time: 'Time Trial',
  sequence: 'In Order',
  grid: 'Grid Based',
};

export const MODIFIER_NAMES: Record<Modifier, string> = {
  hidden: 'Hidden',
  inverted: 'Inverted',
  chained: 'Chained',
  speed: 'Speed',
};

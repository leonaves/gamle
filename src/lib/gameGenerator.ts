import type { GameConfig, GameState, Mechanic, Element, Constraint, Modifier } from './types';
import { createSeededRandom, pickRandom } from './random';

const MECHANICS: Mechanic[] = ['guess', 'match', 'remember', 'react', 'arrange', 'deduce'];
const MODIFIERS: Modifier[] = ['hidden', 'inverted', 'chained', 'speed'];

// Compatibility matrix - some combinations work better than others
const COMPATIBLE_COMBOS: Record<Mechanic, Element[]> = {
  guess: ['words', 'colors', 'numbers', 'patterns'],
  match: ['colors', 'shapes', 'patterns', 'numbers'],
  remember: ['colors', 'shapes', 'patterns', 'numbers'],
  react: ['colors', 'shapes', 'numbers'],
  arrange: ['numbers', 'colors', 'shapes', 'patterns'],
  deduce: ['numbers', 'colors', 'patterns', 'words'],
};

const COMPATIBLE_CONSTRAINTS: Record<Mechanic, Constraint[]> = {
  guess: ['attempts', 'time'],
  match: ['attempts', 'time', 'grid'],
  remember: ['attempts', 'sequence', 'time'],
  react: ['time', 'sequence'],
  arrange: ['attempts', 'grid', 'time'],
  deduce: ['attempts', 'time', 'grid'],
};

export function generateGameConfig(seed: number): GameConfig {
  const random = createSeededRandom(seed);

  // Pick mechanic first
  const mechanic = pickRandom(MECHANICS, random);

  // Pick compatible element
  const compatibleElements = COMPATIBLE_COMBOS[mechanic];
  const element = pickRandom(compatibleElements, random);

  // Pick compatible constraint
  const compatibleConstraints = COMPATIBLE_CONSTRAINTS[mechanic];
  const constraint = pickRandom(compatibleConstraints, random);

  // Maybe add a modifier (30% chance)
  const modifier = random() < 0.3 ? pickRandom(MODIFIERS, random) : undefined;

  // Difficulty scales with seed variation
  const difficulty = Math.floor(random() * 3) + 2; // 2-4

  return {
    mechanic,
    element,
    constraint,
    modifier,
    seed,
    difficulty,
  };
}

export function createInitialGameState(config: GameConfig): GameState {
  const baseAttempts = getBaseAttempts(config);
  const timeLimit = getTimeLimit(config);

  return {
    config,
    started: false,
    completed: false,
    won: false,
    score: 0,
    maxScore: getMaxScore(config),
    attempts: 0,
    maxAttempts: baseAttempts,
    timeElapsed: 0,
    timeLimit,
    moves: [],
    data: {},
  };
}

function getBaseAttempts(config: GameConfig): number {
  const base = {
    guess: 6,
    match: 20,
    remember: 3,
    react: 5,
    arrange: 15,
    deduce: 8,
  };

  let attempts = base[config.mechanic];

  // Adjust by difficulty
  attempts = Math.max(3, attempts - (config.difficulty - 2));

  // Modifiers can affect attempts
  if (config.modifier === 'chained') {
    attempts += 2;
  }

  return attempts;
}

function getTimeLimit(config: GameConfig): number | undefined {
  if (config.constraint !== 'time') return undefined;

  const base = {
    guess: 120,
    match: 60,
    remember: 45,
    react: 30,
    arrange: 90,
    deduce: 120,
  };

  let time = base[config.mechanic];

  // Speed modifier halves time
  if (config.modifier === 'speed') {
    time = Math.floor(time / 2);
  }

  return time;
}

function getMaxScore(config: GameConfig): number {
  // Base score depends on mechanic
  const base = {
    guess: 6,
    match: 100,
    remember: 100,
    react: 100,
    arrange: 100,
    deduce: 100,
  };

  return base[config.mechanic] * config.difficulty;
}

export function getGameDescription(config: GameConfig): string {
  const descriptions: Record<Mechanic, Record<Element, string>> = {
    guess: {
      words: 'Guess the hidden word',
      colors: 'Guess the color sequence',
      numbers: 'Guess the secret number',
      shapes: 'Guess the shape',
      patterns: 'Guess the pattern rule',
    },
    match: {
      colors: 'Match the color pairs',
      shapes: 'Match the shapes',
      patterns: 'Match the patterns',
      numbers: 'Match the number pairs',
      words: 'Match the words',
    },
    remember: {
      colors: 'Remember the color sequence',
      shapes: 'Remember the shape positions',
      patterns: 'Remember the pattern',
      numbers: 'Remember the numbers',
      words: 'Remember the words',
    },
    react: {
      colors: 'Tap the right colors quickly',
      shapes: 'Catch the shapes',
      numbers: 'Hit the target numbers',
      patterns: 'React to the pattern',
      words: 'React to the words',
    },
    arrange: {
      numbers: 'Arrange numbers in order',
      colors: 'Sort the colors',
      shapes: 'Arrange the shapes',
      patterns: 'Complete the pattern',
      words: 'Arrange the words',
    },
    deduce: {
      numbers: 'Deduce the number from clues',
      colors: 'Deduce the color code',
      patterns: 'Find the pattern rule',
      words: 'Deduce the word from hints',
      shapes: 'Deduce the shapes',
    },
  };

  let desc = descriptions[config.mechanic][config.element];

  if (config.modifier) {
    const modifierDesc: Record<Modifier, string> = {
      hidden: ' (elements hidden)',
      inverted: ' (controls inverted)',
      chained: ' (chain combos)',
      speed: ' (speed mode)',
    };
    desc += modifierDesc[config.modifier];
  }

  return desc;
}

export function getGameEmoji(config: GameConfig): string {
  const mechanic: Record<Mechanic, string> = {
    guess: '🎯',
    match: '🃏',
    remember: '🧠',
    react: '⚡',
    arrange: '📊',
    deduce: '🔍',
  };

  const element: Record<Element, string> = {
    words: '📝',
    colors: '🎨',
    shapes: '⬡',
    numbers: '🔢',
    patterns: '✨',
  };

  return `${mechanic[config.mechanic]}${element[config.element]}`;
}

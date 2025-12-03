import type { GameConfig, GameState, Mechanic, Element, Constraint, Modifier } from './types';
import { createSeededRandom, pickRandom } from './random';

const MECHANICS: Mechanic[] = ['guess', 'match', 'remember', 'react', 'arrange', 'deduce', 'trace', 'hunt', 'stack', 'dodge', 'chase', 'bounce'];
const MODIFIERS: Modifier[] = ['hidden', 'inverted', 'chained', 'speed', 'mirrored', 'blind', 'zen', 'chaos', 'turbo', 'gravity'];

// Compatibility matrix - some combinations work better than others
const COMPATIBLE_COMBOS: Record<Mechanic, Element[]> = {
  guess: ['words', 'colors', 'numbers', 'patterns', 'emoji', 'math'],
  match: ['colors', 'shapes', 'patterns', 'numbers', 'emoji'],
  remember: ['colors', 'shapes', 'patterns', 'numbers', 'emoji', 'directions'],
  react: ['colors', 'shapes', 'numbers', 'emoji', 'directions'],
  arrange: ['numbers', 'colors', 'shapes', 'patterns', 'emoji', 'math'],
  deduce: ['numbers', 'colors', 'patterns', 'words', 'math'],
  trace: ['directions', 'shapes', 'patterns', 'colors'],
  hunt: ['emoji', 'shapes', 'colors', 'numbers'],
  stack: ['colors', 'shapes', 'numbers', 'emoji', 'math'],
  dodge: ['colors', 'shapes', 'numbers', 'emoji'],
  chase: ['colors', 'shapes', 'numbers', 'emoji'],
  bounce: ['colors', 'shapes', 'numbers', 'emoji'],
};

const COMPATIBLE_CONSTRAINTS: Record<Mechanic, Constraint[]> = {
  guess: ['attempts', 'time'],
  match: ['attempts', 'time', 'grid'],
  remember: ['attempts', 'sequence', 'time', 'streak'],
  react: ['time', 'sequence', 'streak', 'precision'],
  arrange: ['attempts', 'grid', 'time'],
  deduce: ['attempts', 'time', 'grid'],
  trace: ['attempts', 'time', 'precision'],
  hunt: ['time', 'attempts', 'streak'],
  stack: ['time', 'attempts', 'streak', 'precision'],
  dodge: ['time', 'survival'],
  chase: ['time', 'survival', 'laps'],
  bounce: ['survival', 'time'],
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
  const base: Record<Mechanic, number> = {
    guess: 6,
    match: 20,
    remember: 3,
    react: 5,
    arrange: 15,
    deduce: 8,
    trace: 3,
    hunt: 10,
    stack: 10,
    dodge: 3,
    chase: 3,
    bounce: 3,
  };

  let attempts = base[config.mechanic];

  // Adjust by difficulty
  attempts = Math.max(3, attempts - (config.difficulty - 2));

  // Modifiers can affect attempts
  if (config.modifier === 'chained') {
    attempts += 2;
  }
  if (config.modifier === 'zen') {
    attempts += 5; // More forgiving
  }

  return attempts;
}

function getTimeLimit(config: GameConfig): number | undefined {
  if (config.constraint !== 'time' && config.constraint !== 'streak' && config.constraint !== 'survival') return undefined;

  const base: Record<Mechanic, number> = {
    guess: 120,
    match: 60,
    remember: 45,
    react: 30,
    arrange: 90,
    deduce: 120,
    trace: 60,
    hunt: 45,
    stack: 60,
    dodge: 60,
    chase: 90,
    bounce: 120,
  };

  let time = base[config.mechanic];

  // Speed modifier halves time
  if (config.modifier === 'speed') {
    time = Math.floor(time / 2);
  }
  // Zen modifier doubles time
  if (config.modifier === 'zen') {
    time = time * 2;
  }

  return time;
}

function getMaxScore(config: GameConfig): number {
  const base: Record<Mechanic, number> = {
    guess: 6,
    match: 100,
    remember: 100,
    react: 100,
    arrange: 100,
    deduce: 100,
    trace: 100,
    hunt: 100,
    stack: 100,
    dodge: 100,
    chase: 100,
    bounce: 100,
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
      emoji: 'Guess the emoji',
      directions: 'Guess the direction sequence',
      math: 'Guess the answer',
    },
    match: {
      colors: 'Match the color pairs',
      shapes: 'Match the shapes',
      patterns: 'Match the patterns',
      numbers: 'Match the number pairs',
      words: 'Match the words',
      emoji: 'Match the emoji pairs',
      directions: 'Match the directions',
      math: 'Match equations to answers',
    },
    remember: {
      colors: 'Remember the color sequence',
      shapes: 'Remember the shape positions',
      patterns: 'Remember the pattern',
      numbers: 'Remember the numbers',
      words: 'Remember the words',
      emoji: 'Remember the emoji sequence',
      directions: 'Remember the directions',
      math: 'Remember the equations',
    },
    react: {
      colors: 'Tap the right colors quickly',
      shapes: 'Catch the shapes',
      numbers: 'Hit the target numbers',
      patterns: 'React to the pattern',
      words: 'React to the words',
      emoji: 'Tap the correct emoji',
      directions: 'Press the right direction',
      math: 'Solve quickly',
    },
    arrange: {
      numbers: 'Arrange numbers in order',
      colors: 'Sort the colors',
      shapes: 'Arrange the shapes',
      patterns: 'Complete the pattern',
      words: 'Arrange the words',
      emoji: 'Sort the emoji',
      directions: 'Order the directions',
      math: 'Order by value',
    },
    deduce: {
      numbers: 'Deduce the number from clues',
      colors: 'Deduce the color code',
      patterns: 'Find the pattern rule',
      words: 'Deduce the word from hints',
      shapes: 'Deduce the shapes',
      emoji: 'Deduce the emoji',
      directions: 'Deduce the path',
      math: 'Deduce the operation',
    },
    trace: {
      directions: 'Follow the arrow path',
      shapes: 'Trace the shape pattern',
      patterns: 'Trace the sequence',
      colors: 'Follow the color trail',
      words: 'Trace the word path',
      emoji: 'Follow the emoji trail',
      numbers: 'Trace the number path',
      math: 'Follow the equation',
    },
    hunt: {
      emoji: 'Find the hidden emoji',
      shapes: 'Hunt the shapes',
      colors: 'Find the colors',
      numbers: 'Hunt the numbers',
      words: 'Find the words',
      patterns: 'Hunt the patterns',
      directions: 'Find the arrows',
      math: 'Hunt the answers',
    },
    stack: {
      colors: 'Stack matching colors',
      shapes: 'Stack the shapes',
      numbers: 'Stack to target sum',
      emoji: 'Stack matching emoji',
      math: 'Stack to solve equations',
      words: 'Stack the words',
      patterns: 'Stack the patterns',
      directions: 'Stack the directions',
    },
    dodge: {
      colors: 'Dodge traffic, collect colors',
      shapes: 'Cross lanes, grab shapes',
      numbers: 'Navigate and collect numbers',
      emoji: 'Frogger-style emoji hunt',
      words: 'Dodge and collect words',
      patterns: 'Cross to find patterns',
      directions: 'Navigate the lanes',
      math: 'Dodge to solve math',
    },
    chase: {
      colors: 'Chase colors, avoid ghosts',
      shapes: 'Collect shapes in the maze',
      numbers: 'Hunt numbers, escape enemies',
      emoji: 'Pac-Man style emoji chase',
      words: 'Collect words, dodge foes',
      patterns: 'Chase patterns in maze',
      directions: 'Navigate the grid',
      math: 'Solve math, avoid ghosts',
    },
    bounce: {
      colors: 'Break color blocks',
      shapes: 'Smash shape bricks',
      numbers: 'Break number blocks',
      emoji: 'Breakout with emoji',
      words: 'Destroy word blocks',
      patterns: 'Break pattern bricks',
      directions: 'Smash direction blocks',
      math: 'Break math blocks',
    },
  };

  let desc = descriptions[config.mechanic][config.element];

  if (config.modifier) {
    const modifierDesc: Record<Modifier, string> = {
      hidden: ' (elements hidden)',
      inverted: ' (controls inverted)',
      chained: ' (chain combos)',
      speed: ' (speed mode)',
      mirrored: ' (mirrored)',
      blind: ' (blind mode)',
      zen: ' (relaxed)',
      chaos: ' (chaos mode)',
      turbo: ' (turbo speed)',
      gravity: ' (gravity mode)',
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
    trace: '✏️',
    hunt: '🔎',
    stack: '📚',
    dodge: '🐸',
    chase: '👻',
    bounce: '🏓',
  };

  const element: Record<Element, string> = {
    words: '📝',
    colors: '🎨',
    shapes: '⬡',
    numbers: '🔢',
    patterns: '✨',
    emoji: '😀',
    directions: '🧭',
    math: '➕',
  };

  return `${mechanic[config.mechanic]}${element[config.element]}`;
}

import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, shuffleArray, pickRandom } from '../lib/random';
import { COLORS, WORDS } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface Clue {
  type: string;
  value: string;
  revealed: boolean;
}

interface DeduceData {
  target: string | number;
  clues: Clue[];
  guesses: (string | number)[];
  options: (string | number)[];
  revealedClues: number;
}

export function DeduceGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<DeduceData | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);

  // Initialize game
  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);

      let target: string | number;
      let clues: Clue[] = [];
      let options: (string | number)[] = [];

      if (config.element === 'numbers') {
        target = Math.floor(random() * 100) + 1;
        const num = target as number;

        clues = [
          { type: 'range', value: num <= 50 ? '1-50' : '51-100', revealed: true },
          {
            type: 'parity',
            value: num % 2 === 0 ? 'Even number' : 'Odd number',
            revealed: false,
          },
          {
            type: 'divisible',
            value: num % 5 === 0 ? 'Divisible by 5' : 'Not divisible by 5',
            revealed: false,
          },
          {
            type: 'digits',
            value: `Digits sum to ${String(num).split('').reduce((a, b) => a + parseInt(b), 0)}`,
            revealed: false,
          },
          { type: 'compare', value: num > 25 && num < 75 ? 'Middle range' : 'Edge range', revealed: false },
        ];

        // Generate options including the target
        const decoys = Array.from({ length: 7 }, () => Math.floor(random() * 100) + 1).filter(
          (n) => n !== num
        );
        options = shuffleArray([num, ...decoys.slice(0, 7)], random);
      } else if (config.element === 'colors') {
        const colors = COLORS.primary;
        const targetColor = pickRandom(colors, random);
        target = targetColor.name;

        clues = [
          {
            type: 'warm',
            value: ['Red', 'Orange', 'Yellow'].includes(targetColor.name) ? 'Warm color' : 'Cool color',
            revealed: true,
          },
          {
            type: 'primary',
            value: ['Red', 'Blue', 'Yellow'].includes(targetColor.name) ? 'Primary color' : 'Secondary color',
            revealed: false,
          },
          {
            type: 'letter',
            value: `Starts with "${targetColor.name[0]}"`,
            revealed: false,
          },
          {
            type: 'length',
            value: `${targetColor.name.length} letters`,
            revealed: false,
          },
        ];

        options = shuffleArray(colors.map((c) => c.name), random);
      } else if (config.element === 'words') {
        const words = WORDS.common;
        const targetWord = pickRandom(words, random);
        target = targetWord;

        clues = [
          { type: 'length', value: `${targetWord.length} letters`, revealed: true },
          { type: 'starts', value: `Starts with "${targetWord[0].toUpperCase()}"`, revealed: false },
          { type: 'ends', value: `Ends with "${targetWord[targetWord.length - 1]}"`, revealed: false },
          {
            type: 'vowels',
            value: `${targetWord.match(/[aeiou]/gi)?.length || 0} vowels`,
            revealed: false,
          },
          {
            type: 'contains',
            value: `Contains "${targetWord[Math.floor(targetWord.length / 2)]}"`,
            revealed: false,
          },
        ];

        // Get decoys of same length
        const sameLength = words.filter((w) => w.length === targetWord.length && w !== targetWord);
        const decoys = shuffleArray(sameLength, random).slice(0, 7);
        options = shuffleArray([targetWord, ...decoys], random);
      } else {
        // Patterns - deduce the rule
        const patterns = [
          { seq: [2, 4, 6, 8], rule: 'Add 2' },
          { seq: [1, 2, 4, 8], rule: 'Multiply by 2' },
          { seq: [1, 4, 9, 16], rule: 'Square numbers' },
          { seq: [1, 1, 2, 3], rule: 'Fibonacci' },
          { seq: [3, 6, 9, 12], rule: 'Add 3' },
          { seq: [5, 10, 15, 20], rule: 'Add 5' },
        ];
        const pattern = pickRandom(patterns, random);
        target = pattern.rule;

        clues = [
          { type: 'sequence', value: `Sequence: ${pattern.seq.join(', ')}, ?`, revealed: true },
          { type: 'hint1', value: `Next number is ${pattern.seq[3] + (pattern.seq[3] - pattern.seq[2])}`, revealed: false },
          { type: 'hint2', value: `It's an ${pattern.rule.includes('Add') ? 'arithmetic' : 'other'} pattern`, revealed: false },
        ];

        options = shuffleArray(patterns.map((p) => p.rule), random);
      }

      const data: DeduceData = {
        target,
        clues,
        guesses: [],
        options,
        revealedClues: 1,
      };

      setGameData(data);
      onStateChange({
        ...state,
        started: true,
        maxScore: clues.length * 20,
        data: { initialized: true },
      });
    }
  }, [config.seed, config.element, state, onStateChange]);

  const revealClue = useCallback(() => {
    if (!gameData || state.completed) return;

    const nextUnrevealed = gameData.clues.findIndex((c) => !c.revealed);
    if (nextUnrevealed === -1) return;

    const newClues = [...gameData.clues];
    newClues[nextUnrevealed] = { ...newClues[nextUnrevealed], revealed: true };

    setGameData({
      ...gameData,
      clues: newClues,
      revealedClues: gameData.revealedClues + 1,
    });
  }, [gameData, state.completed]);

  const submitGuess = useCallback(() => {
    if (!gameData || state.completed || selectedOption === null) return;

    const guess = selectedOption;
    const correct = guess === gameData.target ||
      (typeof guess === 'string' && typeof gameData.target === 'string' &&
       guess.toLowerCase() === gameData.target.toLowerCase());

    const move: GameMove = {
      type: 'deduce',
      value: guess,
      timestamp: Date.now(),
      correct,
    };

    const newGuesses = [...gameData.guesses, guess];
    const attempts = state.attempts + 1;

    if (correct) {
      // Score based on clues used (fewer = better)
      const score = Math.max(20, state.maxScore - (gameData.revealedClues - 1) * 20);
      setGameData({ ...gameData, guesses: newGuesses });
      onStateChange({
        ...state,
        attempts,
        completed: true,
        won: true,
        score,
        moves: [...state.moves, move],
      });
      onComplete(true, score);
    } else if (attempts >= state.maxAttempts) {
      setGameData({ ...gameData, guesses: newGuesses });
      onStateChange({
        ...state,
        attempts,
        completed: true,
        won: false,
        score: 0,
        moves: [...state.moves, move],
      });
      onComplete(false, 0);
    } else {
      setGameData({ ...gameData, guesses: newGuesses });
      onStateChange({
        ...state,
        attempts,
        moves: [...state.moves, move],
      });
      setSelectedOption(null);
    }
  }, [gameData, state, selectedOption, onStateChange, onComplete]);

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  const unrevealedClues = gameData.clues.filter((c) => !c.revealed).length;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Clues */}
      <div className="w-full max-w-md space-y-2">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Clues
        </h3>
        {gameData.clues.map((clue, index) => (
          <div
            key={index}
            className={`px-4 py-3 rounded-lg transition-all ${
              clue.revealed
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            }`}
          >
            {clue.revealed ? (
              <span className="animate-fade-in">{clue.value}</span>
            ) : (
              <span className="italic">Hidden clue</span>
            )}
          </div>
        ))}

        {unrevealedClues > 0 && !state.completed && (
          <button
            onClick={revealClue}
            className="w-full px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            Reveal another clue ({unrevealedClues} remaining)
          </button>
        )}
      </div>

      {/* Options */}
      <div className="w-full max-w-md">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Your guess
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {gameData.options.map((option) => {
            const wasGuessed = gameData.guesses.includes(option);
            const isSelected = selectedOption === option;

            return (
              <button
                key={String(option)}
                onClick={() => !wasGuessed && setSelectedOption(option)}
                disabled={wasGuessed || state.completed}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  wasGuessed
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] line-through'
                    : isSelected
                    ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      {!state.completed && (
        <button
          onClick={submitGuess}
          disabled={selectedOption === null}
          className="px-8 py-3 bg-[var(--success)] text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Submit Guess
        </button>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
        <span>
          Guesses: {state.attempts}/{state.maxAttempts}
        </span>
        <span>Clues used: {gameData.revealedClues}</span>
      </div>

      {/* Result */}
      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">
              Correct! The answer was {gameData.target}
            </p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">
              The answer was: {gameData.target}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

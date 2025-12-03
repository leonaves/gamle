import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, pickRandom, shuffleArray } from '../lib/random';
import { EMOJI, COLORS, SHAPES } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface HiddenItem {
  id: number;
  value: string;
  color?: string;
  x: number;
  y: number;
  found: boolean;
  isTarget: boolean;
}

interface HuntData {
  items: HiddenItem[];
  target: { value: string; color?: string };
  found: number;
  totalTargets: number;
  round: number;
}

export function HuntGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<HuntData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      const totalTargets = 3 + config.difficulty;
      const totalItems = totalTargets * 3;

      let allItems: { value: string; color?: string }[] = [];
      if (config.element === 'emoji') {
        const category = pickRandom(Object.keys(EMOJI) as (keyof typeof EMOJI)[], random);
        allItems = EMOJI[category].map((e) => ({ value: e }));
      } else if (config.element === 'colors') {
        allItems = COLORS.primary.map((c) => ({ value: '●', color: c.hex }));
      } else if (config.element === 'shapes') {
        allItems = SHAPES.basic.map((s) => ({ value: s.symbol }));
      } else {
        allItems = Array.from({ length: 9 }, (_, i) => ({ value: (i + 1).toString() }));
      }

      const target = pickRandom(allItems, random);
      const items: HiddenItem[] = [];

      // Add targets
      for (let i = 0; i < totalTargets; i++) {
        items.push({
          id: i,
          value: target.value,
          color: target.color,
          x: 5 + random() * 90,
          y: 5 + random() * 85,
          found: false,
          isTarget: true,
        });
      }

      // Add distractors
      const distractors = allItems.filter((item) => item.value !== target.value);
      for (let i = 0; i < totalItems - totalTargets; i++) {
        const distractor = pickRandom(distractors, random);
        items.push({
          id: totalTargets + i,
          value: distractor.value,
          color: distractor.color,
          x: 5 + random() * 90,
          y: 5 + random() * 85,
          found: false,
          isTarget: false,
        });
      }

      const data: HuntData = {
        items: shuffleArray(items, random),
        target,
        found: 0,
        totalTargets,
        round: 1,
      };

      setGameData(data);
      setTimeLeft(state.timeLimit || 45);
      onStateChange({
        ...state,
        started: true,
        maxScore: totalTargets * 20,
        data: { initialized: true },
      });
    }
  }, [config, state, onStateChange]);

  // Timer
  useEffect(() => {
    if (!gameData || state.completed || timeLeft === null) return;

    if (timeLeft <= 0) {
      const won = gameData.found >= gameData.totalTargets / 2;
      onStateChange({
        ...state,
        completed: true,
        won,
        score: gameData.found * 20,
      });
      onComplete(won, gameData.found * 20);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameData, state, onStateChange, onComplete]);

  const handleClick = useCallback(
    (item: HiddenItem) => {
      if (!gameData || state.completed || item.found) return;

      const move: GameMove = {
        type: 'hunt',
        value: item.value,
        timestamp: Date.now(),
        correct: item.isTarget,
      };

      const newItems = gameData.items.map((i) =>
        i.id === item.id ? { ...i, found: true } : i
      );

      if (item.isTarget) {
        const newFound = gameData.found + 1;
        const score = newFound * 20;

        if (newFound >= gameData.totalTargets) {
          setGameData({ ...gameData, items: newItems, found: newFound });
          onStateChange({
            ...state,
            completed: true,
            won: true,
            score,
            moves: [...state.moves, move],
          });
          onComplete(true, score);
        } else {
          setGameData({ ...gameData, items: newItems, found: newFound });
          onStateChange({
            ...state,
            score,
            moves: [...state.moves, move],
          });
        }
      } else {
        const attempts = state.attempts + 1;
        if (attempts >= state.maxAttempts) {
          setGameData({ ...gameData, items: newItems });
          onStateChange({
            ...state,
            attempts,
            completed: true,
            won: false,
            moves: [...state.moves, move],
          });
          onComplete(false, gameData.found * 20);
        } else {
          setGameData({ ...gameData, items: newItems });
          onStateChange({
            ...state,
            attempts,
            moves: [...state.moves, move],
          });
        }
      }
    },
    [gameData, state, onStateChange, onComplete]
  );

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Target indicator */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] rounded-full">
        <span className="text-[var(--text-muted)]">Find all:</span>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
          style={gameData.target.color ? { backgroundColor: gameData.target.color } : { backgroundColor: 'var(--bg-tertiary)' }}
        >
          {!gameData.target.color && gameData.target.value}
        </div>
      </div>

      {/* Hunt area */}
      <div className="relative w-full max-w-md h-72 sm:h-96 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border-2 border-[var(--border)]">
        {gameData.items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            disabled={item.found || state.completed}
            className={`absolute w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
              item.found
                ? item.isTarget
                  ? 'bg-[var(--success)] scale-110'
                  : 'bg-[var(--error)] opacity-30 scale-75'
                : 'bg-[var(--bg-tertiary)] hover:scale-110 active:scale-95'
            }`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: !item.found && item.color ? item.color : undefined,
            }}
          >
            {!item.color && item.value}
            {item.found && item.isTarget && '✓'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <span
          className={`font-mono text-lg ${timeLeft && timeLeft <= 10 ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}
        >
          {timeLeft}s
        </span>
        <span className="text-[var(--success)]">
          Found: {gameData.found}/{gameData.totalTargets}
        </span>
        <span className="text-[var(--error)]">
          Misses: {state.attempts}/{state.maxAttempts}
        </span>
      </div>

      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">
              Found them all!
            </p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">
              {timeLeft === 0 ? "Time's up!" : 'Too many misses!'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

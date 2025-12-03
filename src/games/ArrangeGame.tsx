import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, shuffleArray, pickRandomN } from '../lib/random';
import { COLORS, SHAPES } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface Item {
  id: number;
  value: string;
  sortValue: number;
  color?: string;
}

interface ArrangeData {
  items: Item[];
  targetOrder: number[];
  selected: number | null;
}

export function ArrangeGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<ArrangeData | null>(null);

  // Initialize game
  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      const count = 4 + config.difficulty;

      let items: Item[] = [];

      if (config.element === 'numbers') {
        const nums = shuffleArray(
          Array.from({ length: 20 }, (_, i) => i + 1),
          random
        ).slice(0, count);
        items = nums.map((n, i) => ({
          id: i,
          value: n.toString(),
          sortValue: n,
        }));
      } else if (config.element === 'colors') {
        // Sort by hue
        const colors = pickRandomN([...COLORS.primary, ...COLORS.extended], count, random);
        items = colors.map((c, i) => ({
          id: i,
          value: c.name,
          sortValue: i, // Use original index as sort order (alphabetical)
          color: c.hex,
        }));
        // Sort alphabetically for target
        const sorted = [...items].sort((a, b) => a.value.localeCompare(b.value));
        items = items.map((item) => ({
          ...item,
          sortValue: sorted.findIndex((s) => s.id === item.id),
        }));
      } else if (config.element === 'shapes') {
        const shapes = pickRandomN([...SHAPES.basic], count, random);
        items = shapes.map((s, i) => ({
          id: i,
          value: s.symbol,
          sortValue: i,
        }));
        // Sort alphabetically by name
        const sortedByName = [...SHAPES.basic].sort((a, b) => a.name.localeCompare(b.name));
        items = items.map((item) => {
          const shape = SHAPES.basic.find((s) => s.symbol === item.value);
          return {
            ...item,
            sortValue: shape ? sortedByName.findIndex((s) => s.symbol === shape.symbol) : item.sortValue,
          };
        });
      } else {
        // Patterns - arrange by complexity
        const patterns = ['○', '◐', '●', '□', '◧', '■', '△', '◮', '▲'];
        const selected = pickRandomN(patterns, count, random);
        items = selected.map((p, i) => ({
          id: i,
          value: p,
          sortValue: patterns.indexOf(p),
        }));
      }

      const targetOrder = [...items].sort((a, b) => a.sortValue - b.sortValue).map((i) => i.id);
      const shuffled = shuffleArray(items, random);

      const data: ArrangeData = {
        items: shuffled,
        targetOrder,
        selected: null,
      };

      setGameData(data);
      onStateChange({
        ...state,
        started: true,
        maxScore: count * 10,
        data: { initialized: true },
      });
    }
  }, [config.seed, config.element, config.difficulty, state, onStateChange]);

  const checkComplete = useCallback(
    (items: Item[]) => {
      if (!gameData) return false;
      const currentOrder = items.map((i) => i.id);
      return JSON.stringify(currentOrder) === JSON.stringify(gameData.targetOrder);
    },
    [gameData]
  );

  const handleSelect = useCallback(
    (index: number) => {
      if (!gameData || state.completed) return;

      if (gameData.selected === null) {
        setGameData({ ...gameData, selected: index });
      } else if (gameData.selected === index) {
        setGameData({ ...gameData, selected: null });
      } else {
        // Swap
        const newItems = [...gameData.items];
        [newItems[gameData.selected], newItems[index]] = [newItems[index], newItems[gameData.selected]];

        const move: GameMove = {
          type: 'arrange',
          value: [gameData.selected, index],
          timestamp: Date.now(),
        };

        const attempts = state.attempts + 1;
        const isComplete = checkComplete(newItems);
        const score = isComplete ? Math.max(10, state.maxScore - attempts * 2) : 0;

        setGameData({ ...gameData, items: newItems, selected: null });

        if (isComplete) {
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
          onStateChange({
            ...state,
            attempts,
            moves: [...state.moves, move],
          });
        }
      }
    },
    [gameData, state, checkComplete, onStateChange, onComplete]
  );

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  // Check how many are in correct position
  const correctPositions = gameData.items.filter(
    (item, index) => item.id === gameData.targetOrder[index]
  ).length;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Instructions */}
      <p className="text-[var(--text-secondary)] text-center">
        {config.element === 'numbers' && 'Arrange the numbers in ascending order'}
        {config.element === 'colors' && 'Arrange the colors alphabetically'}
        {config.element === 'shapes' && 'Arrange the shapes alphabetically'}
        {config.element === 'patterns' && 'Arrange from simplest to most complex'}
      </p>

      {/* Items */}
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {gameData.items.map((item, index) => {
          const isCorrect = item.id === gameData.targetOrder[index];
          const isSelected = gameData.selected === index;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(index)}
              disabled={state.completed}
              className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl text-2xl font-bold transition-all ${
                isSelected
                  ? 'ring-4 ring-[var(--accent)] scale-105'
                  : isCorrect && state.completed
                  ? 'bg-[var(--success)]'
                  : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
              style={item.color && !state.completed ? { backgroundColor: item.color } : {}}
            >
              {!item.color && item.value}
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
        <span>
          Correct: {correctPositions}/{gameData.items.length}
        </span>
        <span>
          Swaps: {state.attempts}/{state.maxAttempts}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--success)] transition-all duration-300"
          style={{ width: `${(correctPositions / gameData.items.length) * 100}%` }}
        />
      </div>

      {/* Result */}
      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">
              Sorted in {state.attempts} swaps!
            </p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">Out of moves!</p>
          )}
        </div>
      )}
    </div>
  );
}

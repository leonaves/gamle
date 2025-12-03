import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, pickRandom } from '../lib/random';
import { DIRECTIONS, COLORS, SHAPES } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface TraceData {
  path: { symbol: string; color?: string }[];
  currentIndex: number;
  showingPath: boolean;
  userPath: number[];
}

export function TraceGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<TraceData | null>(null);
  const [options, setOptions] = useState<{ symbol: string; color?: string; key?: string }[]>([]);

  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      const pathLength = 4 + config.difficulty;

      let items: { symbol: string; color?: string; key?: string }[] = [];
      if (config.element === 'directions') {
        items = DIRECTIONS.cardinal.map((d) => ({ symbol: d.symbol, key: d.key }));
      } else if (config.element === 'colors') {
        items = COLORS.primary.map((c) => ({ symbol: '●', color: c.hex }));
      } else if (config.element === 'shapes') {
        items = SHAPES.basic.map((s) => ({ symbol: s.symbol }));
      } else {
        items = ['◐', '◑', '◒', '◓'].map((p) => ({ symbol: p }));
      }

      setOptions(items);

      const path = Array.from({ length: pathLength }, () => pickRandom(items, random));

      const data: TraceData = {
        path,
        currentIndex: 0,
        showingPath: true,
        userPath: [],
      };

      setGameData(data);
      onStateChange({
        ...state,
        started: true,
        maxScore: pathLength * 10,
        data: { initialized: true },
      });

      // Show path then hide
      setTimeout(() => {
        setGameData((prev) => (prev ? { ...prev, showingPath: false } : null));
      }, pathLength * 800 + 1000);
    }
  }, [config, state, onStateChange]);

  const handleInput = useCallback(
    (index: number) => {
      if (!gameData || gameData.showingPath || state.completed) return;

      const expectedIndex = options.findIndex(
        (o) => o.symbol === gameData.path[gameData.userPath.length].symbol &&
              o.color === gameData.path[gameData.userPath.length].color
      );
      const correct = index === expectedIndex;

      const move: GameMove = {
        type: 'trace',
        value: options[index].symbol,
        timestamp: Date.now(),
        correct,
      };

      if (!correct) {
        const attempts = state.attempts + 1;
        const completed = attempts >= state.maxAttempts;

        onStateChange({
          ...state,
          attempts,
          completed,
          won: false,
          moves: [...state.moves, move],
        });

        if (completed) {
          onComplete(false, 0);
        } else {
          // Reset path
          setGameData({ ...gameData, userPath: [], showingPath: true, currentIndex: 0 });
          setTimeout(() => {
            setGameData((prev) => (prev ? { ...prev, showingPath: false } : null));
          }, gameData.path.length * 800 + 1000);
        }
      } else {
        const newUserPath = [...gameData.userPath, index];

        if (newUserPath.length === gameData.path.length) {
          const score = gameData.path.length * 10;
          setGameData({ ...gameData, userPath: newUserPath });
          onStateChange({
            ...state,
            completed: true,
            won: true,
            score,
            moves: [...state.moves, move],
          });
          onComplete(true, score);
        } else {
          setGameData({ ...gameData, userPath: newUserPath });
          onStateChange({
            ...state,
            moves: [...state.moves, move],
          });
        }
      }
    },
    [gameData, options, state, onStateChange, onComplete]
  );

  // Handle keyboard for directions
  useEffect(() => {
    if (config.element !== 'directions' || !gameData || gameData.showingPath) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const index = options.findIndex((o) => o.key === e.key);
      if (index !== -1) {
        handleInput(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.element, gameData, options, handleInput]);

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Path display */}
      <div className="flex gap-2 flex-wrap justify-center min-h-[60px]">
        {gameData.showingPath ? (
          gameData.path.map((item, i) => (
            <div
              key={i}
              className="w-12 h-12 flex items-center justify-center text-2xl rounded-lg bg-[var(--bg-secondary)] animate-pop"
              style={{
                animationDelay: `${i * 800}ms`,
                backgroundColor: item.color || undefined,
              }}
            >
              {!item.color && item.symbol}
            </div>
          ))
        ) : (
          <div className="flex gap-2">
            {gameData.path.map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 flex items-center justify-center text-2xl rounded-lg ${
                  i < gameData.userPath.length
                    ? 'bg-[var(--success)]'
                    : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                {i < gameData.userPath.length ? '✓' : '?'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input buttons */}
      {!gameData.showingPath && !state.completed && (
        <div className="grid grid-cols-2 gap-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleInput(index)}
              className="w-20 h-20 flex items-center justify-center text-3xl rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors active:scale-95"
              style={option.color ? { backgroundColor: option.color } : {}}
            >
              {!option.color && option.symbol}
            </button>
          ))}
        </div>
      )}

      {/* Instructions */}
      <p className="text-sm text-[var(--text-muted)] text-center">
        {gameData.showingPath ? 'Watch the path...' : 'Repeat the path!'}
      </p>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
        <span>
          Progress: {gameData.userPath.length}/{gameData.path.length}
        </span>
        <span>
          Lives: {state.maxAttempts - state.attempts}/{state.maxAttempts}
        </span>
      </div>

      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">Path complete!</p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">Wrong path!</p>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, pickRandom } from '../lib/random';
import { COLORS, SHAPES, EMOJI } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface FallingItem {
  id: number;
  value: string | number;
  color?: string;
  x: number;
  y: number;
  speed: number;
  isTarget: boolean;
}

interface StackData {
  items: FallingItem[];
  target: { value: string | number; color?: string } | null;
  targetSum?: number;
  currentSum: number;
  collected: number;
  needed: number;
  spawnCounter: number;
}

export function StackGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<StackData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      const needed = 5 + config.difficulty;

      let target: { value: string | number; color?: string } | null = null;
      let targetSum: number | undefined = undefined;

      if (config.element === 'colors') {
        const color = pickRandom(COLORS.primary, random);
        target = { value: color.name, color: color.hex };
      } else if (config.element === 'shapes') {
        const shape = pickRandom(SHAPES.basic, random);
        target = { value: shape.symbol };
      } else if (config.element === 'emoji') {
        const category = pickRandom(Object.keys(EMOJI) as (keyof typeof EMOJI)[], random);
        target = { value: pickRandom(EMOJI[category], random) };
      } else if (config.element === 'numbers' || config.element === 'math') {
        targetSum = 10 + config.difficulty * 5;
      }

      const data: StackData = {
        items: [],
        target,
        targetSum,
        currentSum: 0,
        collected: 0,
        needed,
        spawnCounter: 0,
      };

      setGameData(data);
      setTimeLeft(state.timeLimit || 60);
      onStateChange({
        ...state,
        started: true,
        maxScore: needed * 15,
        data: { initialized: true },
      });
    }
  }, [config, state, onStateChange]);

  // Game loop
  useEffect(() => {
    if (!gameData || state.completed) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setGameData((prev) => {
        if (!prev) return prev;

        // Move items down
        let newItems = prev.items.map((item) => ({
          ...item,
          y: item.y + item.speed * delta * 60,
        }));

        // Remove items that fell off screen
        newItems = newItems.filter((item) => item.y < 110);

        // Spawn new items
        let newSpawnCounter = prev.spawnCounter + delta;
        if (newSpawnCounter > 1) {
          newSpawnCounter = 0;
          const random = createSeededRandom(config.seed + Date.now());

          let value: string | number = '';
          let color: string | undefined;
          let isTarget = false;

          if (config.element === 'colors' && prev.target) {
            const allColors = COLORS.primary;
            const chosen = pickRandom(allColors, random);
            value = chosen.name;
            color = chosen.hex;
            isTarget = chosen.hex === prev.target.color;
          } else if (config.element === 'shapes' && prev.target) {
            const allShapes = SHAPES.basic;
            const chosen = pickRandom(allShapes, random);
            value = chosen.symbol;
            isTarget = chosen.symbol === prev.target.value;
          } else if (config.element === 'emoji' && prev.target) {
            const category = pickRandom(Object.keys(EMOJI) as (keyof typeof EMOJI)[], random);
            value = pickRandom(EMOJI[category], random);
            isTarget = value === prev.target.value;
          } else if (config.element === 'numbers' || config.element === 'math') {
            value = Math.floor(random() * 9) + 1;
            isTarget = true; // All numbers can contribute
          }

          newItems.push({
            id: Date.now() + Math.random(),
            value,
            color,
            x: 10 + random() * 80,
            y: -10,
            speed: 1 + config.difficulty * 0.3,
            isTarget,
          });
        }

        return { ...prev, items: newItems, spawnCounter: newSpawnCounter };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameData, state.completed, config]);

  // Timer
  useEffect(() => {
    if (!gameData || state.completed || timeLeft === null) return;

    if (timeLeft <= 0) {
      const won = gameData.targetSum
        ? gameData.currentSum >= gameData.targetSum
        : gameData.collected >= gameData.needed;
      const score = gameData.targetSum
        ? Math.min(gameData.currentSum, gameData.targetSum) * 2
        : gameData.collected * 15;

      onStateChange({ ...state, completed: true, won, score });
      onComplete(won, score);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameData, state, onStateChange, onComplete]);

  const handleCatch = useCallback(
    (item: FallingItem) => {
      if (!gameData || state.completed) return;

      const move: GameMove = {
        type: 'stack',
        value: item.value,
        timestamp: Date.now(),
        correct: item.isTarget,
      };

      // Remove the item
      const newItems = gameData.items.filter((i) => i.id !== item.id);

      if (gameData.targetSum !== undefined) {
        // Number stacking mode
        const newSum = gameData.currentSum + (item.value as number);

        if (newSum >= gameData.targetSum) {
          setGameData({ ...gameData, items: newItems, currentSum: newSum });
          onStateChange({
            ...state,
            completed: true,
            won: true,
            score: gameData.targetSum * 2,
            moves: [...state.moves, move],
          });
          onComplete(true, gameData.targetSum * 2);
        } else {
          setGameData({ ...gameData, items: newItems, currentSum: newSum });
          onStateChange({
            ...state,
            score: newSum * 2,
            moves: [...state.moves, move],
          });
        }
      } else {
        // Matching mode
        if (item.isTarget) {
          const newCollected = gameData.collected + 1;
          const score = newCollected * 15;

          if (newCollected >= gameData.needed) {
            setGameData({ ...gameData, items: newItems, collected: newCollected });
            onStateChange({
              ...state,
              completed: true,
              won: true,
              score,
              moves: [...state.moves, move],
            });
            onComplete(true, score);
          } else {
            setGameData({ ...gameData, items: newItems, collected: newCollected });
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
            onComplete(false, gameData.collected * 15);
          } else {
            setGameData({ ...gameData, items: newItems });
            onStateChange({
              ...state,
              attempts,
              moves: [...state.moves, move],
            });
          }
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
        {gameData.targetSum !== undefined ? (
          <>
            <span className="text-[var(--text-muted)]">Stack to:</span>
            <span className="text-xl font-bold">{gameData.targetSum}</span>
            <span className="text-[var(--text-muted)]">Current:</span>
            <span className="text-xl font-bold text-[var(--accent)]">{gameData.currentSum}</span>
          </>
        ) : gameData.target ? (
          <>
            <span className="text-[var(--text-muted)]">Catch:</span>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
              style={gameData.target.color ? { backgroundColor: gameData.target.color } : { backgroundColor: 'var(--bg-tertiary)' }}
            >
              {!gameData.target.color && gameData.target.value}
            </div>
          </>
        ) : null}
      </div>

      {/* Game area */}
      <div className="relative w-full max-w-md h-72 sm:h-96 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border-2 border-[var(--border)]">
        {gameData.items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleCatch(item)}
            disabled={state.completed}
            className="absolute w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-transform hover:scale-110 active:scale-95"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: item.color || 'var(--bg-tertiary)',
            }}
          >
            {!item.color && item.value}
          </button>
        ))}

        {/* Catch zone indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[var(--accent)] opacity-30" />
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <span
          className={`font-mono text-lg ${timeLeft && timeLeft <= 10 ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}
        >
          {timeLeft}s
        </span>
        {gameData.targetSum === undefined && (
          <>
            <span className="text-[var(--success)]">
              Caught: {gameData.collected}/{gameData.needed}
            </span>
            <span className="text-[var(--error)]">
              Misses: {state.attempts}/{state.maxAttempts}
            </span>
          </>
        )}
      </div>

      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">
              {gameData.targetSum !== undefined ? 'Target reached!' : 'Great catching!'}
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

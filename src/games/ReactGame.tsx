import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, pickRandom } from '../lib/random';
import { COLORS, SHAPES } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface Target {
  id: number;
  value: string;
  color?: string;
  x: number;
  y: number;
  isTarget: boolean;
  clicked: boolean;
}

interface ReactData {
  targets: Target[];
  currentTarget: { value: string; color?: string } | null;
  round: number;
  maxRounds: number;
  hits: number;
  misses: number;
}

export function ReactGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<ReactData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  // Initialize game
  useEffect(() => {
    if (!state.data.initialized) {
      const data: ReactData = {
        targets: [],
        currentTarget: null,
        round: 0,
        maxRounds: 5 + config.difficulty * 2,
        hits: 0,
        misses: 0,
      };

      setGameData(data);
      setTimeLeft(state.timeLimit || 30);
      onStateChange({
        ...state,
        started: true,
        maxScore: data.maxRounds * 10,
        data: { initialized: true },
      });
    }
  }, [config.difficulty, state, onStateChange]);

  // Spawn targets
  useEffect(() => {
    if (!gameData || state.completed || !gameData.currentTarget) return;

    const spawnTargets = () => {
      const random = createSeededRandom(config.seed + gameData.round * 1000 + Date.now());
      const numTargets = 3 + Math.floor(config.difficulty / 2);

      let items: { value: string; color?: string }[] = [];
      if (config.element === 'colors') {
        items = COLORS.primary.map((c) => ({ value: c.name, color: c.hex }));
      } else if (config.element === 'shapes') {
        items = SHAPES.basic.map((s) => ({ value: s.symbol }));
      } else {
        items = Array.from({ length: 9 }, (_, i) => ({ value: (i + 1).toString() }));
      }

      const targets: Target[] = [];
      const targetItem = gameData.currentTarget;
      if (!targetItem) return;

      for (let i = 0; i < numTargets; i++) {
        const isTarget = i === 0; // First one is always the target
        const item = isTarget ? targetItem : pickRandom(items.filter((it) => it.value !== targetItem.value), random);
        if (!item) continue;
        targets.push({
          id: i,
          value: item.value,
          color: item.color,
          x: 10 + random() * 80,
          y: 10 + random() * 70,
          isTarget,
          clicked: false,
        });
      }

      // Shuffle positions
      targets.forEach((t) => {
        t.x = 10 + random() * 80;
        t.y = 10 + random() * 70;
      });

      setGameData((prev) => (prev ? { ...prev, targets } : null));
    };

    spawnTargets();
    const interval = setInterval(spawnTargets, 2000 - config.difficulty * 200);
    return () => clearInterval(interval);
  }, [gameData?.round, gameData?.currentTarget, config, state.completed]);

  // Start first round
  useEffect(() => {
    if (gameData && !gameData.currentTarget && !state.completed) {
      const random = createSeededRandom(config.seed);
      let items: { value: string; color?: string }[] = [];

      if (config.element === 'colors') {
        items = COLORS.primary.map((c) => ({ value: c.name, color: c.hex }));
      } else if (config.element === 'shapes') {
        items = SHAPES.basic.map((s) => ({ value: s.symbol }));
      } else {
        items = Array.from({ length: 9 }, (_, i) => ({ value: (i + 1).toString() }));
      }

      const target = pickRandom(items, random);
      setGameData((prev) => (prev ? { ...prev, currentTarget: target, round: 1 } : null));
    }
  }, [gameData, config, state.completed]);

  // Timer
  useEffect(() => {
    if (!gameData || state.completed || timeLeft === null) return;

    if (timeLeft <= 0) {
      const won = gameData.hits >= gameData.maxRounds / 2;
      onStateChange({
        ...state,
        completed: true,
        won,
        score: gameData.hits * 10,
      });
      onComplete(won, gameData.hits * 10);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      onStateChange({ ...state, timeElapsed: (state.timeElapsed || 0) + 1 });
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameData, state, onStateChange, onComplete]);

  const handleClick = useCallback(
    (target: Target) => {
      if (!gameData || state.completed || target.clicked) return;

      const move: GameMove = {
        type: 'react',
        value: target.value,
        timestamp: Date.now(),
        correct: target.isTarget,
      };

      // Mark as clicked
      const newTargets = gameData.targets.map((t) =>
        t.id === target.id ? { ...t, clicked: true } : t
      );

      if (target.isTarget) {
        const newHits = gameData.hits + 1;
        const completed = newHits >= gameData.maxRounds;
        const score = newHits * 10;

        if (completed) {
          setGameData({ ...gameData, targets: newTargets, hits: newHits });
          onStateChange({
            ...state,
            completed: true,
            won: true,
            score,
            moves: [...state.moves, move],
          });
          onComplete(true, score);
        } else {
          // New round
          const random = createSeededRandom(config.seed + (gameData.round + 1) * 100);
          let items: { value: string; color?: string }[] = [];

          if (config.element === 'colors') {
            items = COLORS.primary.map((c) => ({ value: c.name, color: c.hex }));
          } else if (config.element === 'shapes') {
            items = SHAPES.basic.map((s) => ({ value: s.symbol }));
          } else {
            items = Array.from({ length: 9 }, (_, i) => ({ value: (i + 1).toString() }));
          }

          const newTarget = pickRandom(items, random);

          setGameData({
            ...gameData,
            targets: [],
            hits: newHits,
            round: gameData.round + 1,
            currentTarget: newTarget,
          });
          onStateChange({
            ...state,
            score,
            moves: [...state.moves, move],
          });
        }
      } else {
        const newMisses = gameData.misses + 1;
        const attempts = state.attempts + 1;

        if (attempts >= state.maxAttempts) {
          setGameData({ ...gameData, targets: newTargets, misses: newMisses });
          onStateChange({
            ...state,
            attempts,
            completed: true,
            won: false,
            moves: [...state.moves, move],
          });
          onComplete(false, gameData.hits * 10);
        } else {
          setGameData({ ...gameData, targets: newTargets, misses: newMisses });
          onStateChange({
            ...state,
            attempts,
            moves: [...state.moves, move],
          });
        }
      }
    },
    [gameData, state, config, onStateChange, onComplete]
  );

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Target indicator */}
      {gameData.currentTarget && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] rounded-full">
          <span className="text-[var(--text-muted)]">Find:</span>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
            style={gameData.currentTarget.color ? { backgroundColor: gameData.currentTarget.color } : { backgroundColor: 'var(--bg-tertiary)' }}
          >
            {!gameData.currentTarget.color && gameData.currentTarget.value}
          </div>
        </div>
      )}

      {/* Game area */}
      <div
        ref={gameRef}
        className="relative w-full max-w-md h-64 sm:h-80 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border-2 border-[var(--border)]"
      >
        {gameData.targets.map((target) => (
          <button
            key={target.id}
            onClick={() => handleClick(target)}
            disabled={target.clicked || state.completed}
            className={`absolute w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold transition-all hover:scale-110 active:scale-95 ${
              target.clicked
                ? target.isTarget
                  ? 'bg-[var(--success)]'
                  : 'bg-[var(--error)] opacity-50'
                : ''
            }`}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: !target.clicked && target.color ? target.color : undefined,
              ...(target.clicked ? {} : { backgroundColor: target.color || 'var(--bg-tertiary)' }),
            }}
          >
            {!target.color && target.value}
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
          Hits: {gameData.hits}/{gameData.maxRounds}
        </span>
        <span className="text-[var(--error)]">
          Misses: {state.attempts}/{state.maxAttempts}
        </span>
      </div>

      {/* Result */}
      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">
              Great reflexes! {gameData.hits} targets hit!
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

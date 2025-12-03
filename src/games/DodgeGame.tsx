import { useState, useEffect, useRef } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, pickRandom } from '../lib/random';
import { COLORS, SHAPES, EMOJI } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface Lane {
  obstacles: { x: number; value: string; color?: string; isTarget: boolean }[];
  speed: number;
  direction: 1 | -1;
}

interface DodgeData {
  playerY: number;
  playerX: number;
  lanes: Lane[];
  target: { value: string; color?: string };
  collected: number;
  needed: number;
  lives: number;
}

export function DodgeGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<DodgeData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      const numLanes = 4 + Math.floor(config.difficulty / 2);
      const needed = 3 + config.difficulty;

      let items: { value: string; color?: string }[] = [];
      if (config.element === 'colors') {
        items = COLORS.primary.map((c) => ({ value: '●', color: c.hex }));
      } else if (config.element === 'shapes') {
        items = SHAPES.basic.map((s) => ({ value: s.symbol }));
      } else if (config.element === 'emoji') {
        const category = pickRandom(Object.keys(EMOJI) as (keyof typeof EMOJI)[], random);
        items = EMOJI[category].map((e) => ({ value: e }));
      } else {
        items = Array.from({ length: 9 }, (_, i) => ({ value: (i + 1).toString() }));
      }

      const target = pickRandom(items, random);

      const lanes: Lane[] = Array.from({ length: numLanes }, () => {
        const numObstacles = 2 + Math.floor(random() * 3);
        const obstacles = Array.from({ length: numObstacles }, () => {
          const item = random() < 0.3 ? target : pickRandom(items.filter(it => it.value !== target.value), random);
          return {
            x: random() * 100,
            value: item.value,
            color: item.color,
            isTarget: item.value === target.value && item.color === target.color,
          };
        });

        return {
          obstacles,
          speed: 20 + random() * 30 + config.difficulty * 5,
          direction: random() < 0.5 ? 1 : -1,
        };
      });

      const data: DodgeData = {
        playerY: numLanes, // Start at bottom
        playerX: 50,
        lanes,
        target,
        collected: 0,
        needed,
        lives: 3,
      };

      setGameData(data);
      setTimeLeft(state.timeLimit || 60);
      onStateChange({
        ...state,
        started: true,
        maxScore: needed * 25,
        maxAttempts: 3,
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

        // Move obstacles
        const newLanes = prev.lanes.map((lane) => ({
          ...lane,
          obstacles: lane.obstacles.map((obs) => {
            let newX = obs.x + lane.speed * lane.direction * delta;
            if (newX > 100) newX = -10;
            if (newX < -10) newX = 100;
            return { ...obs, x: newX };
          }),
        }));

        // Handle player movement
        let newX = prev.playerX;
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
          newX = Math.max(5, newX - 60 * delta);
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
          newX = Math.min(95, newX + 60 * delta);
        }

        return { ...prev, lanes: newLanes, playerX: newX };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameData, state.completed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);

        if (!gameData || state.completed) return;

        // Vertical movement (discrete)
        if (e.key === 'ArrowUp' || e.key === 'w') {
          setGameData((prev) => {
            if (!prev || prev.playerY <= 0) return prev;
            return { ...prev, playerY: prev.playerY - 1 };
          });
        }
        if (e.key === 'ArrowDown' || e.key === 's') {
          setGameData((prev) => {
            if (!prev || prev.playerY >= prev.lanes.length) return prev;
            return { ...prev, playerY: prev.playerY + 1 };
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameData, state.completed]);

  // Collision detection
  useEffect(() => {
    if (!gameData || state.completed) return;

    const playerLaneIndex = gameData.playerY - 1;
    if (playerLaneIndex < 0 || playerLaneIndex >= gameData.lanes.length) return;

    const lane = gameData.lanes[playerLaneIndex];
    const playerX = gameData.playerX;

    for (const obs of lane.obstacles) {
      const dist = Math.abs(obs.x - playerX);
      if (dist < 8) {
        const move: GameMove = {
          type: 'dodge',
          value: obs.value,
          timestamp: Date.now(),
          correct: obs.isTarget,
        };

        if (obs.isTarget) {
          // Collected target!
          const newCollected = gameData.collected + 1;
          const score = newCollected * 25;

          // Remove this obstacle and add new one
          const newLanes = gameData.lanes.map((l, i) => {
            if (i !== playerLaneIndex) return l;
            return {
              ...l,
              obstacles: l.obstacles.map((o) => {
                if (o === obs) {
                  return { ...o, x: -20 }; // Move off screen
                }
                return o;
              }),
            };
          });

          if (newCollected >= gameData.needed) {
            setGameData({ ...gameData, lanes: newLanes, collected: newCollected });
            onStateChange({
              ...state,
              completed: true,
              won: true,
              score,
              moves: [...state.moves, move],
            });
            onComplete(true, score);
          } else {
            setGameData({ ...gameData, lanes: newLanes, collected: newCollected });
            onStateChange({
              ...state,
              score,
              moves: [...state.moves, move],
            });
          }
        } else {
          // Hit wrong item
          const newLives = gameData.lives - 1;

          // Move obstacle away
          const newLanes = gameData.lanes.map((l, i) => {
            if (i !== playerLaneIndex) return l;
            return {
              ...l,
              obstacles: l.obstacles.map((o) => {
                if (o === obs) return { ...o, x: -20 };
                return o;
              }),
            };
          });

          if (newLives <= 0) {
            setGameData({ ...gameData, lanes: newLanes, lives: newLives });
            onStateChange({
              ...state,
              attempts: state.attempts + 1,
              completed: true,
              won: false,
              moves: [...state.moves, move],
            });
            onComplete(false, gameData.collected * 25);
          } else {
            setGameData({ ...gameData, lanes: newLanes, lives: newLives, playerY: gameData.lanes.length });
            onStateChange({
              ...state,
              attempts: state.attempts + 1,
              moves: [...state.moves, move],
            });
          }
        }
        break;
      }
    }
  }, [gameData?.playerX, gameData?.playerY, gameData?.lanes]);

  // Timer
  useEffect(() => {
    if (!gameData || state.completed || timeLeft === null) return;

    if (timeLeft <= 0) {
      const won = gameData.collected >= gameData.needed;
      onStateChange({ ...state, completed: true, won, score: gameData.collected * 25 });
      onComplete(won, gameData.collected * 25);
      return;
    }

    const timer = setTimeout(() => setTimeLeft((prev) => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameData, state, onStateChange, onComplete]);

  // Touch controls
  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!gameData || state.completed) return;

    setGameData((prev) => {
      if (!prev) return prev;
      if (direction === 'up' && prev.playerY > 0) return { ...prev, playerY: prev.playerY - 1 };
      if (direction === 'down' && prev.playerY < prev.lanes.length) return { ...prev, playerY: prev.playerY + 1 };
      if (direction === 'left') return { ...prev, playerX: Math.max(5, prev.playerX - 15) };
      if (direction === 'right') return { ...prev, playerX: Math.min(95, prev.playerX + 15) };
      return prev;
    });
  };

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  const laneHeight = 100 / (gameData.lanes.length + 1);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Target */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] rounded-full">
        <span className="text-[var(--text-muted)]">Collect:</span>
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-lg font-bold"
          style={gameData.target.color ? { backgroundColor: gameData.target.color } : { backgroundColor: 'var(--bg-tertiary)' }}
        >
          {!gameData.target.color && gameData.target.value}
        </div>
      </div>

      {/* Game area */}
      <div className="relative w-full max-w-md h-72 sm:h-80 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border-2 border-[var(--border)]">
        {/* Safe zone at top */}
        <div
          className="absolute left-0 right-0 bg-[var(--success)] opacity-20"
          style={{ top: 0, height: `${laneHeight}%` }}
        />

        {/* Lanes */}
        {gameData.lanes.map((lane, laneIndex) => (
          <div
            key={laneIndex}
            className="absolute left-0 right-0 border-t border-[var(--border)]"
            style={{
              top: `${(laneIndex + 1) * laneHeight}%`,
              height: `${laneHeight}%`,
              backgroundColor: laneIndex % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent',
            }}
          >
            {lane.obstacles.map((obs, obsIndex) => (
              <div
                key={obsIndex}
                className={`absolute w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-colors ${
                  obs.isTarget ? 'ring-2 ring-[var(--success)]' : ''
                }`}
                style={{
                  left: `${obs.x}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: obs.color || 'var(--bg-tertiary)',
                }}
              >
                {!obs.color && obs.value}
              </div>
            ))}
          </div>
        ))}

        {/* Player */}
        <div
          className="absolute w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all duration-100"
          style={{
            left: `${gameData.playerX}%`,
            top: `${gameData.playerY * laneHeight + laneHeight / 2}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          🐸
        </div>

        {/* Goal indicator */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-[var(--success)] font-bold">
          SAFE ZONE ↑
        </div>
      </div>

      {/* Touch controls */}
      <div className="grid grid-cols-3 gap-2 w-32">
        <div />
        <button onClick={() => handleMove('up')} className="w-10 h-10 bg-[var(--bg-tertiary)] rounded flex items-center justify-center">↑</button>
        <div />
        <button onClick={() => handleMove('left')} className="w-10 h-10 bg-[var(--bg-tertiary)] rounded flex items-center justify-center">←</button>
        <button onClick={() => handleMove('down')} className="w-10 h-10 bg-[var(--bg-tertiary)] rounded flex items-center justify-center">↓</button>
        <button onClick={() => handleMove('right')} className="w-10 h-10 bg-[var(--bg-tertiary)] rounded flex items-center justify-center">→</button>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <span className={`font-mono text-lg ${timeLeft && timeLeft <= 10 ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {timeLeft}s
        </span>
        <span className="text-[var(--success)]">Collected: {gameData.collected}/{gameData.needed}</span>
        <span className="text-[var(--error)]">Lives: {'❤️'.repeat(gameData.lives)}</span>
      </div>

      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">Made it across!</p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">
              {timeLeft === 0 ? "Time's up!" : 'Out of lives!'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

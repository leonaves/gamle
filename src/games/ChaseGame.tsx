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

interface GridCell {
  value: string;
  color?: string;
  isTarget: boolean;
  collected: boolean;
}

interface Enemy {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface ChaseData {
  grid: GridCell[][];
  playerX: number;
  playerY: number;
  enemies: Enemy[];
  target: { value: string; color?: string };
  collected: number;
  needed: number;
  powerUp: boolean;
  powerUpTimer: number;
}

export function ChaseGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<ChaseData | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      const gridSize = 7;
      const needed = 5 + config.difficulty;
      const numEnemies = 1 + Math.floor(config.difficulty / 2);

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

      // Create grid with items
      const grid: GridCell[][] = [];
      for (let y = 0; y < gridSize; y++) {
        const row: GridCell[] = [];
        for (let x = 0; x < gridSize; x++) {
          const isEmpty = random() < 0.3;
          if (isEmpty) {
            row.push({ value: '', isTarget: false, collected: false });
          } else {
            const item = random() < 0.25 ? target : pickRandom(items.filter(i => i.value !== target.value), random);
            row.push({
              value: item.value,
              color: item.color,
              isTarget: item.value === target.value && item.color === target.color,
              collected: false,
            });
          }
        }
        grid.push(row);
      }

      // Make sure there are enough targets
      let targetCount = grid.flat().filter((c) => c.isTarget).length;
      while (targetCount < needed) {
        const x = Math.floor(random() * gridSize);
        const y = Math.floor(random() * gridSize);
        if (!grid[y][x].isTarget && grid[y][x].value !== '') {
          grid[y][x] = { ...grid[y][x], value: target.value, color: target.color, isTarget: true };
          targetCount++;
        }
      }

      // Clear player start position
      const centerY = Math.floor(gridSize / 2);
      const centerX = Math.floor(gridSize / 2);
      grid[centerY][centerX] = { value: '', isTarget: false, collected: true };

      // Create enemies
      const enemies: Enemy[] = Array.from({ length: numEnemies }, () => ({
        x: random() < 0.5 ? 0 : gridSize - 1,
        y: random() < 0.5 ? 0 : gridSize - 1,
        dx: random() < 0.5 ? 1 : -1,
        dy: random() < 0.5 ? 1 : -1,
      }));

      const data: ChaseData = {
        grid,
        playerX: centerX,
        playerY: centerY,
        enemies,
        target,
        collected: 0,
        needed,
        powerUp: false,
        powerUpTimer: 0,
      };

      setGameData(data);
      setTimeLeft(state.timeLimit || 45);
      onStateChange({
        ...state,
        started: true,
        maxScore: needed * 20,
        maxAttempts: 3,
        data: { initialized: true },
      });
    }
  }, [config, state, onStateChange]);

  // Game loop for enemy movement
  useEffect(() => {
    if (!gameData || state.completed) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setGameData((prev) => {
        if (!prev) return prev;

        // Move enemies
        const gridSize = prev.grid.length;
        const newEnemies = prev.enemies.map((enemy) => {
          let newX = enemy.x + enemy.dx * delta * 2;
          let newY = enemy.y + enemy.dy * delta * 2;
          let newDx = enemy.dx;
          let newDy = enemy.dy;

          // Bounce off walls
          if (newX <= 0 || newX >= gridSize - 1) {
            newDx = -newDx;
            newX = Math.max(0, Math.min(gridSize - 1, newX));
          }
          if (newY <= 0 || newY >= gridSize - 1) {
            newDy = -newDy;
            newY = Math.max(0, Math.min(gridSize - 1, newY));
          }

          return { x: newX, y: newY, dx: newDx, dy: newDy };
        });

        // Update power-up timer
        let newPowerUp = prev.powerUp;
        let newPowerUpTimer = prev.powerUpTimer;
        if (prev.powerUp) {
          newPowerUpTimer -= delta;
          if (newPowerUpTimer <= 0) {
            newPowerUp = false;
            newPowerUpTimer = 0;
          }
        }

        return { ...prev, enemies: newEnemies, powerUp: newPowerUp, powerUpTimer: newPowerUpTimer };
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
        if (!gameData || state.completed) return;

        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
        if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

        movePlayer(dx, dy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameData, state.completed]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!gameData || state.completed) return;

    const gridSize = gameData.grid.length;
    const newX = Math.max(0, Math.min(gridSize - 1, gameData.playerX + dx));
    const newY = Math.max(0, Math.min(gridSize - 1, gameData.playerY + dy));

    if (newX === gameData.playerX && newY === gameData.playerY) return;

    const cell = gameData.grid[newY][newX];
    const newGrid = gameData.grid.map((row, y) =>
      row.map((c, x) => (y === newY && x === newX ? { ...c, collected: true } : c))
    );

    const move: GameMove = {
      type: 'chase',
      value: cell.value || 'move',
      timestamp: Date.now(),
      correct: cell.isTarget || cell.value === '',
    };

    let newCollected = gameData.collected;
    let newPowerUp = gameData.powerUp;
    let newPowerUpTimer = gameData.powerUpTimer;

    if (cell.isTarget && !cell.collected) {
      newCollected++;
      // Eating a target gives brief power-up
      newPowerUp = true;
      newPowerUpTimer = 2;
    }

    const score = newCollected * 20;

    if (newCollected >= gameData.needed) {
      setGameData({ ...gameData, grid: newGrid, playerX: newX, playerY: newY, collected: newCollected });
      onStateChange({
        ...state,
        completed: true,
        won: true,
        score,
        moves: [...state.moves, move],
      });
      onComplete(true, score);
    } else if (cell.value && !cell.isTarget && !cell.collected) {
      // Hit wrong item
      const attempts = state.attempts + 1;
      if (attempts >= state.maxAttempts) {
        setGameData({ ...gameData, grid: newGrid, playerX: newX, playerY: newY });
        onStateChange({
          ...state,
          attempts,
          completed: true,
          won: false,
          moves: [...state.moves, move],
        });
        onComplete(false, score);
      } else {
        setGameData({ ...gameData, grid: newGrid, playerX: newX, playerY: newY });
        onStateChange({
          ...state,
          attempts,
          score,
          moves: [...state.moves, move],
        });
      }
    } else {
      setGameData({
        ...gameData,
        grid: newGrid,
        playerX: newX,
        playerY: newY,
        collected: newCollected,
        powerUp: newPowerUp,
        powerUpTimer: newPowerUpTimer,
      });
      onStateChange({
        ...state,
        score,
        moves: [...state.moves, move],
      });
    }
  }, [gameData, state, onStateChange, onComplete]);

  // Enemy collision detection
  useEffect(() => {
    if (!gameData || state.completed || gameData.powerUp) return;

    for (const enemy of gameData.enemies) {
      const dist = Math.sqrt(
        Math.pow(enemy.x - gameData.playerX, 2) + Math.pow(enemy.y - gameData.playerY, 2)
      );

      if (dist < 0.8) {
        const attempts = state.attempts + 1;
        const move: GameMove = {
          type: 'chase',
          value: 'caught',
          timestamp: Date.now(),
          correct: false,
        };

        if (attempts >= state.maxAttempts) {
          onStateChange({
            ...state,
            attempts,
            completed: true,
            won: false,
            moves: [...state.moves, move],
          });
          onComplete(false, gameData.collected * 20);
        } else {
          // Reset player to center
          const centerY = Math.floor(gameData.grid.length / 2);
          const centerX = Math.floor(gameData.grid.length / 2);
          setGameData({
            ...gameData,
            playerX: centerX,
            playerY: centerY,
          });
          onStateChange({
            ...state,
            attempts,
            moves: [...state.moves, move],
          });
        }
        break;
      }
    }
  }, [gameData?.enemies, gameData?.playerX, gameData?.playerY, gameData?.powerUp]);

  // Timer
  useEffect(() => {
    if (!gameData || state.completed || timeLeft === null) return;

    if (timeLeft <= 0) {
      const won = gameData.collected >= gameData.needed;
      onStateChange({ ...state, completed: true, won, score: gameData.collected * 20 });
      onComplete(won, gameData.collected * 20);
      return;
    }

    const timer = setTimeout(() => setTimeLeft((prev) => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameData, state, onStateChange, onComplete]);

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  const cellSize = 100 / gameData.grid.length;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Target */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] rounded-full">
        <span className="text-[var(--text-muted)]">Eat:</span>
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-lg font-bold"
          style={gameData.target.color ? { backgroundColor: gameData.target.color } : { backgroundColor: 'var(--bg-tertiary)' }}
        >
          {!gameData.target.color && gameData.target.value}
        </div>
        <span className="text-[var(--text-muted)]">Avoid ghosts!</span>
      </div>

      {/* Game grid */}
      <div className="relative w-full max-w-xs aspect-square bg-[var(--bg-tertiary)] rounded-xl overflow-hidden border-2 border-[var(--border)]">
        {/* Grid cells */}
        {gameData.grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className="absolute flex items-center justify-center text-sm"
              style={{
                left: `${x * cellSize}%`,
                top: `${y * cellSize}%`,
                width: `${cellSize}%`,
                height: `${cellSize}%`,
              }}
            >
              {cell.value && !cell.collected && (
                <div
                  className={`w-4/5 h-4/5 rounded-full flex items-center justify-center ${
                    cell.isTarget ? 'ring-2 ring-[var(--success)] animate-pulse' : ''
                  }`}
                  style={cell.color ? { backgroundColor: cell.color } : { backgroundColor: 'var(--bg-secondary)' }}
                >
                  {!cell.color && <span className="text-xs">{cell.value}</span>}
                </div>
              )}
            </div>
          ))
        )}

        {/* Enemies (ghosts) */}
        {gameData.enemies.map((enemy, i) => (
          <div
            key={i}
            className={`absolute text-2xl transition-all duration-100 ${gameData.powerUp ? 'opacity-50' : ''}`}
            style={{
              left: `${(enemy.x / gameData.grid.length) * 100}%`,
              top: `${(enemy.y / gameData.grid.length) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            👻
          </div>
        ))}

        {/* Player */}
        <div
          className={`absolute text-2xl transition-all duration-150 ${gameData.powerUp ? 'scale-125' : ''}`}
          style={{
            left: `${(gameData.playerX + 0.5) * cellSize}%`,
            top: `${(gameData.playerY + 0.5) * cellSize}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {gameData.powerUp ? '😤' : '😮'}
        </div>
      </div>

      {/* Touch controls */}
      <div className="grid grid-cols-3 gap-2 w-32">
        <div />
        <button onClick={() => movePlayer(0, -1)} className="w-10 h-10 bg-[var(--bg-tertiary)] rounded flex items-center justify-center active:bg-[var(--bg-secondary)]">↑</button>
        <div />
        <button onClick={() => movePlayer(-1, 0)} className="w-10 h-10 bg-[var(--bg-tertiary)] rounded flex items-center justify-center active:bg-[var(--bg-secondary)]">←</button>
        <button onClick={() => movePlayer(0, 1)} className="w-10 h-10 bg-[var(--bg-tertiary)] rounded flex items-center justify-center active:bg-[var(--bg-secondary)]">↓</button>
        <button onClick={() => movePlayer(1, 0)} className="w-10 h-10 bg-[var(--bg-tertiary)] rounded flex items-center justify-center active:bg-[var(--bg-secondary)]">→</button>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <span className={`font-mono text-lg ${timeLeft && timeLeft <= 10 ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'}`}>
          {timeLeft}s
        </span>
        <span className="text-[var(--success)]">Eaten: {gameData.collected}/{gameData.needed}</span>
        <span className="text-[var(--error)]">Lives: {'❤️'.repeat(state.maxAttempts - state.attempts)}</span>
      </div>

      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">Cleared the maze!</p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">
              {timeLeft === 0 ? "Time's up!" : 'Game over!'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

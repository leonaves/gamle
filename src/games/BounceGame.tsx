import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameConfig, GameState } from '../lib/types';
import { createSeededRandom, pickRandom } from '../lib/random';
import { COLORS, SHAPES, EMOJI } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface Block {
  x: number;
  y: number;
  value: string;
  color?: string;
  isTarget: boolean;
  broken: boolean;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface BounceData {
  blocks: Block[];
  ball: Ball;
  paddleX: number;
  target: { value: string; color?: string };
  broken: number;
  needed: number;
  lives: number;
}

export function BounceGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<BounceData | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      const rows = 3 + Math.floor(config.difficulty / 2);
      const cols = 6;
      const needed = 4 + config.difficulty;

      let items: { value: string; color?: string }[] = [];
      if (config.element === 'colors') {
        items = COLORS.primary.map((c) => ({ value: '', color: c.hex }));
      } else if (config.element === 'shapes') {
        items = SHAPES.basic.map((s) => ({ value: s.symbol }));
      } else if (config.element === 'emoji') {
        const category = pickRandom(Object.keys(EMOJI) as (keyof typeof EMOJI)[], random);
        items = EMOJI[category].map((e) => ({ value: e }));
      } else {
        items = Array.from({ length: 9 }, (_, i) => ({ value: (i + 1).toString() }));
      }

      const target = pickRandom(items, random);

      // Create blocks
      const blocks: Block[] = [];
      const blockWidth = 100 / cols;
      const blockHeight = 8;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const item = random() < 0.3 ? target : pickRandom(items.filter(i => i.value !== target.value || i.color !== target.color), random);
          blocks.push({
            x: col * blockWidth,
            y: row * blockHeight + 5,
            value: item.value,
            color: item.color,
            isTarget: item.value === target.value && item.color === target.color,
            broken: false,
          });
        }
      }

      // Ensure enough targets
      let targetCount = blocks.filter((b) => b.isTarget).length;
      const nonTargetBlocks = blocks.filter((b) => !b.isTarget);
      while (targetCount < needed && nonTargetBlocks.length > 0) {
        const idx = Math.floor(random() * nonTargetBlocks.length);
        const block = nonTargetBlocks[idx];
        block.value = target.value;
        block.color = target.color;
        block.isTarget = true;
        nonTargetBlocks.splice(idx, 1);
        targetCount++;
      }

      const data: BounceData = {
        blocks,
        ball: { x: 50, y: 80, dx: (random() - 0.5) * 60, dy: -40 },
        paddleX: 50,
        target,
        broken: 0,
        needed,
        lives: 3,
      };

      setGameData(data);
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

        let { ball, paddleX, blocks, broken, lives } = prev;
        let newDx = ball.dx;
        let newDy = ball.dy;
        let newX = ball.x + ball.dx * delta;
        let newY = ball.y + ball.dy * delta;

        // Paddle movement
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
          paddleX = Math.max(10, paddleX - 80 * delta);
        }
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
          paddleX = Math.min(90, paddleX + 80 * delta);
        }

        // Wall collisions
        if (newX <= 2 || newX >= 98) {
          newDx = -newDx;
          newX = Math.max(2, Math.min(98, newX));
        }
        if (newY <= 2) {
          newDy = -newDy;
          newY = 2;
        }

        // Paddle collision
        const paddleWidth = 20;
        const paddleTop = 90;
        if (newY >= paddleTop && newY <= paddleTop + 5) {
          if (newX >= paddleX - paddleWidth / 2 && newX <= paddleX + paddleWidth / 2) {
            newDy = -Math.abs(newDy);
            // Add some angle based on where ball hit paddle
            const hitPos = (newX - paddleX) / (paddleWidth / 2);
            newDx = newDx + hitPos * 20;
            newY = paddleTop - 1;
          }
        }

        // Ball fell below paddle
        if (newY > 98) {
          lives--;
          if (lives <= 0) {
            return { ...prev, ball: { ...ball, x: newX, y: newY }, lives };
          }
          // Reset ball
          return {
            ...prev,
            ball: { x: 50, y: 80, dx: (Math.random() - 0.5) * 60, dy: -40 },
            paddleX: 50,
            lives,
          };
        }

        // Block collisions
        let hitBlock: Block | null = null;
        const blockWidth = 100 / 6;
        const blockHeight = 8;

        for (const block of blocks) {
          if (block.broken) continue;

          const blockRight = block.x + blockWidth;
          const blockBottom = block.y + blockHeight;

          if (newX >= block.x && newX <= blockRight && newY >= block.y && newY <= blockBottom) {
            hitBlock = block;

            // Determine collision side
            const overlapLeft = newX - block.x;
            const overlapRight = blockRight - newX;
            const overlapTop = newY - block.y;
            const overlapBottom = blockBottom - newY;

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapTop || minOverlap === overlapBottom) {
              newDy = -newDy;
            } else {
              newDx = -newDx;
            }
            break;
          }
        }

        if (hitBlock) {
          blocks = blocks.map((b) => (b === hitBlock ? { ...b, broken: true } : b));
          if (hitBlock.isTarget) {
            broken++;
          }
        }

        return {
          ...prev,
          ball: { x: newX, y: newY, dx: newDx, dy: newDy },
          paddleX,
          blocks,
          broken,
          lives,
        };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameData, state.completed]);

  // Check win/lose conditions
  useEffect(() => {
    if (!gameData || state.completed) return;

    if (gameData.broken >= gameData.needed) {
      const score = gameData.broken * 25;
      onStateChange({ ...state, completed: true, won: true, score });
      onComplete(true, score);
    } else if (gameData.lives <= 0) {
      onStateChange({ ...state, completed: true, won: false, score: gameData.broken * 25 });
      onComplete(false, gameData.broken * 25);
    }
  }, [gameData?.broken, gameData?.lives, gameData?.needed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch/mouse controls
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!gameData || state.completed || !gameAreaRef.current) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setGameData((prev) => (prev ? { ...prev, paddleX: Math.max(10, Math.min(90, x)) } : prev));
  }, [gameData, state.completed]);

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  const blockWidth = 100 / 6;
  const blockHeight = 8;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Target */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] rounded-full">
        <span className="text-[var(--text-muted)]">Break:</span>
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-lg font-bold"
          style={gameData.target.color ? { backgroundColor: gameData.target.color } : { backgroundColor: 'var(--bg-tertiary)' }}
        >
          {!gameData.target.color && gameData.target.value}
        </div>
      </div>

      {/* Game area */}
      <div
        ref={gameAreaRef}
        className="relative w-full max-w-md h-80 sm:h-96 bg-[var(--bg-secondary)] rounded-2xl overflow-hidden border-2 border-[var(--border)] touch-none"
        onPointerMove={handlePointerMove}
      >
        {/* Blocks */}
        {gameData.blocks.map((block, i) => (
          !block.broken && (
            <div
              key={i}
              className={`absolute flex items-center justify-center text-xs font-bold border border-[var(--border)] ${
                block.isTarget ? 'ring-2 ring-[var(--success)] ring-inset' : ''
              }`}
              style={{
                left: `${block.x}%`,
                top: `${block.y}%`,
                width: `${blockWidth}%`,
                height: `${blockHeight}%`,
                backgroundColor: block.color || 'var(--bg-tertiary)',
              }}
            >
              {!block.color && block.value}
            </div>
          )
        ))}

        {/* Ball */}
        <div
          className="absolute w-4 h-4 bg-white rounded-full shadow-lg"
          style={{
            left: `${gameData.ball.x}%`,
            top: `${gameData.ball.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Paddle */}
        <div
          className="absolute h-3 bg-[var(--accent)] rounded-full"
          style={{
            left: `${gameData.paddleX - 10}%`,
            top: '90%',
            width: '20%',
          }}
        />
      </div>

      {/* Touch buttons for mobile */}
      <div className="flex gap-4">
        <button
          onPointerDown={() => keysRef.current.add('ArrowLeft')}
          onPointerUp={() => keysRef.current.delete('ArrowLeft')}
          onPointerLeave={() => keysRef.current.delete('ArrowLeft')}
          className="w-16 h-12 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center text-xl active:bg-[var(--bg-secondary)]"
        >
          ←
        </button>
        <button
          onPointerDown={() => keysRef.current.add('ArrowRight')}
          onPointerUp={() => keysRef.current.delete('ArrowRight')}
          onPointerLeave={() => keysRef.current.delete('ArrowRight')}
          className="w-16 h-12 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center text-xl active:bg-[var(--bg-secondary)]"
        >
          →
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-6 text-sm">
        <span className="text-[var(--success)]">Broken: {gameData.broken}/{gameData.needed}</span>
        <span className="text-[var(--error)]">Lives: {'🔴'.repeat(gameData.lives)}</span>
      </div>

      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">Blocks cleared!</p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">Ball lost!</p>
          )}
        </div>
      )}
    </div>
  );
}

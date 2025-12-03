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

type Phase = 'showing' | 'waiting' | 'input' | 'feedback';

interface RememberData {
  sequence: { value: string; color?: string }[];
  currentLevel: number;
  userInput: number[];
  phase: Phase;
  showingIndex: number;
}

export function RememberGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<RememberData | null>(null);
  const [options, setOptions] = useState<{ value: string; color?: string }[]>([]);
  const timerRef = useRef<number | null>(null);

  // Initialize game
  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      let items: { value: string; color?: string }[] = [];

      if (config.element === 'colors') {
        items = COLORS.primary.map((c) => ({ value: c.name, color: c.hex }));
      } else if (config.element === 'shapes') {
        items = SHAPES.basic.map((s) => ({ value: s.symbol }));
      } else if (config.element === 'numbers') {
        items = Array.from({ length: 9 }, (_, i) => ({ value: (i + 1).toString() }));
      } else {
        items = ['◐', '◑', '◒', '◓', '◴', '◵', '◶', '◷'].map((p) => ({ value: p }));
      }

      setOptions(items);

      // Generate initial sequence (starting level)
      const startLength = config.difficulty + 2;
      const sequence = Array.from({ length: startLength }, () => pickRandom(items, random));

      const data: RememberData = {
        sequence,
        currentLevel: 1,
        userInput: [],
        phase: 'showing',
        showingIndex: 0,
      };

      setGameData(data);
      onStateChange({
        ...state,
        started: true,
        maxScore: 10 * config.difficulty,
        data: { initialized: true },
      });
    }
  }, [config.seed, config.element, config.difficulty, state, onStateChange]);

  // Handle showing sequence
  useEffect(() => {
    if (!gameData || gameData.phase !== 'showing') return;

    if (gameData.showingIndex < gameData.sequence.length) {
      timerRef.current = window.setTimeout(() => {
        setGameData((prev) =>
          prev ? { ...prev, showingIndex: prev.showingIndex + 1 } : null
        );
      }, 800);
    } else {
      timerRef.current = window.setTimeout(() => {
        setGameData((prev) => (prev ? { ...prev, phase: 'input', showingIndex: -1 } : null));
      }, 500);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameData?.phase, gameData?.showingIndex, gameData?.sequence.length]);

  const handleInput = useCallback(
    (index: number) => {
      if (!gameData || gameData.phase !== 'input' || state.completed) return;

      const newInput = [...gameData.userInput, index];
      const currentIndex = newInput.length - 1;
      const expectedIndex = options.findIndex(
        (o) => o.value === gameData.sequence[currentIndex].value
      );
      const correct = index === expectedIndex;

      const move: GameMove = {
        type: 'remember',
        value: options[index].value,
        timestamp: Date.now(),
        correct,
      };

      if (!correct) {
        // Wrong input
        setGameData({ ...gameData, phase: 'feedback', userInput: newInput });

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
          onComplete(false, state.score || 0);
        } else {
          // Reset for next attempt
          setTimeout(() => {
            const random = createSeededRandom(config.seed + attempts);
            const newSequence = Array.from(
              { length: config.difficulty + 2 },
              () => pickRandom(options, random)
            );
            setGameData({
              sequence: newSequence,
              currentLevel: 1,
              userInput: [],
              phase: 'showing',
              showingIndex: 0,
            });
          }, 1500);
        }
      } else if (newInput.length === gameData.sequence.length) {
        // Completed level!
        const newScore = (state.score || 0) + gameData.sequence.length;
        const newLevel = gameData.currentLevel + 1;

        // Check if won (completed enough levels)
        if (newLevel > config.difficulty + 2) {
          onStateChange({
            ...state,
            score: newScore,
            completed: true,
            won: true,
            moves: [...state.moves, move],
          });
          setGameData({ ...gameData, phase: 'feedback', userInput: newInput });
          onComplete(true, newScore);
        } else {
          // Next level - add to sequence
          const random = createSeededRandom(config.seed + newLevel * 100);
          const newSequence = [...gameData.sequence, pickRandom(options, random)];

          onStateChange({
            ...state,
            score: newScore,
            moves: [...state.moves, move],
          });

          setTimeout(() => {
            setGameData({
              sequence: newSequence,
              currentLevel: newLevel,
              userInput: [],
              phase: 'showing',
              showingIndex: 0,
            });
          }, 1000);
        }
      } else {
        // Continue inputting
        setGameData({ ...gameData, userInput: newInput });
        onStateChange({
          ...state,
          moves: [...state.moves, move],
        });
      }
    },
    [gameData, options, state, config, onStateChange, onComplete]
  );

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  const currentShowItem =
    gameData.phase === 'showing' && gameData.showingIndex < gameData.sequence.length
      ? gameData.sequence[gameData.showingIndex]
      : null;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Display area */}
      <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--border)]">
        {currentShowItem ? (
          <div
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl flex items-center justify-center text-4xl font-bold animate-pop"
            style={currentShowItem.color ? { backgroundColor: currentShowItem.color } : {}}
          >
            {!currentShowItem.color && currentShowItem.value}
          </div>
        ) : (
          <div className="text-[var(--text-muted)] text-lg">
            {gameData.phase === 'showing' && 'Watch...'}
            {gameData.phase === 'input' && 'Your turn!'}
            {gameData.phase === 'feedback' && (state.won ? 'Perfect!' : 'Wrong!')}
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {gameData.sequence.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              gameData.phase === 'showing' && i === gameData.showingIndex
                ? 'bg-[var(--accent)] scale-125'
                : i < gameData.userInput.length
                ? 'bg-[var(--success)]'
                : 'bg-[var(--bg-tertiary)]'
            }`}
          />
        ))}
      </div>

      {/* Input buttons */}
      {gameData.phase === 'input' && (
        <div className="grid grid-cols-3 gap-3">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleInput(index)}
              className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl text-2xl font-bold bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors active:scale-95"
              style={option.color ? { backgroundColor: option.color } : {}}
            >
              {!option.color && option.value}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
        <span>Level: {gameData.currentLevel}</span>
        <span>Sequence: {gameData.sequence.length}</span>
        <span>
          Lives: {state.maxAttempts - state.attempts}/{state.maxAttempts}
        </span>
      </div>

      {/* Result */}
      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">
              Perfect memory! Score: {state.score}
            </p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">
              Reached level {gameData.currentLevel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

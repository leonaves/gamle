import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, pickRandom } from '../lib/random';
import { WORDS, COLORS } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface GuessData {
  target: string;
  guesses: string[];
  feedback: { letter: string; status: 'correct' | 'present' | 'absent' }[][];
}

export function GuessGame({ config, state, onStateChange, onComplete }: Props) {
  const [currentGuess, setCurrentGuess] = useState('');
  const [shake, setShake] = useState(false);
  const [gameData, setGameData] = useState<GuessData | null>(null);

  // Initialize game data
  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      let target = '';

      if (config.element === 'words') {
        const wordList = random() > 0.5 ? WORDS.common : WORDS.four;
        target = pickRandom(wordList, random).toUpperCase();
      } else if (config.element === 'colors') {
        const colors = COLORS.primary.map((c) => c.name.charAt(0));
        target = Array(4)
          .fill(0)
          .map(() => pickRandom(colors, random))
          .join('');
      } else if (config.element === 'numbers') {
        target = Array(4)
          .fill(0)
          .map(() => Math.floor(random() * 10).toString())
          .join('');
      } else {
        target = pickRandom(WORDS.four, random).toUpperCase();
      }

      const data: GuessData = { target, guesses: [], feedback: [] };
      setGameData(data);
      onStateChange({
        ...state,
        started: true,
        data: { ...state.data, initialized: true, target },
      });
    } else if (state.data.target) {
      setGameData({
        target: state.data.target as string,
        guesses: (state.data.guesses as string[]) || [],
        feedback: (state.data.feedback as GuessData['feedback']) || [],
      });
    }
  }, [config.seed, config.element, state, onStateChange]);

  const submitGuess = useCallback(() => {
    if (!gameData || state.completed) return;
    if (currentGuess.length !== gameData.target.length) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }

    const guess = currentGuess.toUpperCase();
    const feedback: { letter: string; status: 'correct' | 'present' | 'absent' }[] = [];
    const targetChars = gameData.target.split('');
    const guessChars = guess.split('');
    const used = new Array(targetChars.length).fill(false);

    // First pass: correct positions
    guessChars.forEach((char, i) => {
      if (char === targetChars[i]) {
        feedback[i] = { letter: char, status: 'correct' };
        used[i] = true;
      }
    });

    // Second pass: present but wrong position
    guessChars.forEach((char, i) => {
      if (feedback[i]) return;
      const foundIndex = targetChars.findIndex((t, j) => t === char && !used[j]);
      if (foundIndex !== -1) {
        feedback[i] = { letter: char, status: 'present' };
        used[foundIndex] = true;
      } else {
        feedback[i] = { letter: char, status: 'absent' };
      }
    });

    const newGuesses = [...gameData.guesses, guess];
    const newFeedback = [...gameData.feedback, feedback];
    const won = guess === gameData.target;
    const attempts = state.attempts + 1;
    const completed = won || attempts >= state.maxAttempts;

    const move: GameMove = {
      type: 'guess',
      value: guess,
      timestamp: Date.now(),
      correct: won,
    };

    const newData: GuessData = {
      ...gameData,
      guesses: newGuesses,
      feedback: newFeedback,
    };

    setGameData(newData);
    setCurrentGuess('');

    const score = won ? state.maxAttempts - attempts + 1 : 0;

    onStateChange({
      ...state,
      attempts,
      completed,
      won,
      score,
      moves: [...state.moves, move],
      data: {
        ...state.data,
        guesses: newGuesses,
        feedback: newFeedback,
      },
    });

    if (completed) {
      onComplete(won, score);
    }
  }, [currentGuess, gameData, state, onStateChange, onComplete]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (state.completed) return;

      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace') {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[a-zA-Z0-9]$/.test(e.key) && gameData) {
        setCurrentGuess((prev) => {
          if (prev.length >= gameData.target.length) return prev;
          return prev + e.key.toUpperCase();
        });
      }
    },
    [state.completed, submitGuess, gameData]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  const targetLength = gameData.target.length;
  const emptyRows = Math.max(0, state.maxAttempts - gameData.guesses.length - 1);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Previous guesses */}
      <div className="flex flex-col gap-2">
        {gameData.feedback.map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.map((cell, j) => (
              <div
                key={j}
                className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-xl font-bold rounded-lg animate-flip ${
                  cell.status === 'correct'
                    ? 'bg-[var(--success)] text-white'
                    : cell.status === 'present'
                    ? 'bg-[var(--warning)] text-black'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                }`}
                style={{ animationDelay: `${j * 100}ms` }}
              >
                {cell.letter}
              </div>
            ))}
          </div>
        ))}

        {/* Current guess row */}
        {!state.completed && (
          <div className={`flex gap-2 ${shake ? 'animate-shake' : ''}`}>
            {Array(targetLength)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-xl font-bold rounded-lg border-2 ${
                    currentGuess[i]
                      ? 'border-[var(--accent)] bg-[var(--bg-secondary)]'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)]'
                  }`}
                >
                  {currentGuess[i] || ''}
                </div>
              ))}
          </div>
        )}

        {/* Empty rows */}
        {!state.completed &&
          Array(emptyRows)
            .fill(0)
            .map((_, i) => (
              <div key={`empty-${i}`} className="flex gap-2">
                {Array(targetLength)
                  .fill(0)
                  .map((_, j) => (
                    <div
                      key={j}
                      className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--bg-secondary)] opacity-50"
                    />
                  ))}
              </div>
            ))}
      </div>

      {/* Keyboard */}
      {!state.completed && (
        <div className="flex flex-col gap-2 mt-4">
          {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, i) => (
            <div key={i} className="flex gap-1 justify-center">
              {i === 2 && (
                <button
                  onClick={submitGuess}
                  className="px-3 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  ↵
                </button>
              )}
              {row.split('').map((key) => {
                const allFeedback = gameData.feedback.flat();
                const keyStatus = allFeedback.find((f) => f.letter === key)?.status;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setCurrentGuess((prev) =>
                        prev.length < targetLength ? prev + key : prev
                      )
                    }
                    className={`w-8 h-10 sm:w-10 sm:h-12 flex items-center justify-center rounded-lg font-medium transition-colors ${
                      keyStatus === 'correct'
                        ? 'bg-[var(--success)] text-white'
                        : keyStatus === 'present'
                        ? 'bg-[var(--warning)] text-black'
                        : keyStatus === 'absent'
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
              {i === 2 && (
                <button
                  onClick={() => setCurrentGuess((prev) => prev.slice(0, -1))}
                  className="px-3 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">
              You got it in {state.attempts}!
            </p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">
              The answer was: {gameData.target}
            </p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="text-sm text-[var(--text-muted)] mt-2">
        Attempt {Math.min(state.attempts + 1, state.maxAttempts)} of {state.maxAttempts}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { loadStats } from '../lib/storage';

interface Props {
  mode: 'daily' | 'infinite';
  onModeChange: (mode: 'daily' | 'infinite') => void;
}

export function Header({ mode, onModeChange }: Props) {
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const stats = loadStats();

  return (
    <>
      <header className="w-full border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowHelp(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Help"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <h1 className="text-2xl font-bold tracking-tight">gamle</h1>

          <button
            onClick={() => setShowStats(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Statistics"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2 p-1 bg-[var(--bg-secondary)] rounded-lg">
            <button
              onClick={() => onModeChange('daily')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                mode === 'daily'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => onModeChange('infinite')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                mode === 'infinite'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Infinite
            </button>
          </div>
        </div>
      </header>

      {/* Stats modal */}
      {showStats && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowStats(false)}
        >
          <div
            className="w-full max-w-sm bg-[var(--bg-primary)] rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-center mb-6">Statistics</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-[var(--bg-secondary)] rounded-xl">
                <p className="text-3xl font-bold">{stats.gamesPlayed}</p>
                <p className="text-sm text-[var(--text-muted)]">Played</p>
              </div>
              <div className="text-center p-4 bg-[var(--bg-secondary)] rounded-xl">
                <p className="text-3xl font-bold">
                  {stats.gamesPlayed > 0
                    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-[var(--text-muted)]">Win Rate</p>
              </div>
              <div className="text-center p-4 bg-[var(--bg-secondary)] rounded-xl">
                <p className="text-3xl font-bold">{stats.currentStreak}</p>
                <p className="text-sm text-[var(--text-muted)]">Current Streak</p>
              </div>
              <div className="text-center p-4 bg-[var(--bg-secondary)] rounded-xl">
                <p className="text-3xl font-bold">{stats.maxStreak}</p>
                <p className="text-sm text-[var(--text-muted)]">Max Streak</p>
              </div>
            </div>

            <button
              onClick={() => setShowStats(false)}
              className="w-full px-4 py-3 bg-[var(--accent)] text-white rounded-xl font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Help modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-sm bg-[var(--bg-primary)] rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-center mb-6">How to Play</h2>

            <div className="space-y-4 text-sm text-[var(--text-secondary)]">
              <p>
                <strong className="text-[var(--text-primary)]">Gamle</strong> is a different
                game every day. Each day, a unique game is generated by combining:
              </p>

              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Mechanics</strong> – Guess, Match, Remember, React, Arrange, or Deduce
                </li>
                <li>
                  <strong>Elements</strong> – Words, Colors, Shapes, Numbers, or Patterns
                </li>
                <li>
                  <strong>Constraints</strong> – Limited Tries, Time Trial, Sequence, or Grid
                </li>
              </ul>

              <p>The same game appears for everyone on the same day.</p>

              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <p className="font-medium text-[var(--text-primary)] mb-2">Daily Mode</p>
                <p>One game per day. Complete it to maintain your streak!</p>
              </div>

              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <p className="font-medium text-[var(--text-primary)] mb-2">Infinite Mode</p>
                <p>Practice with unlimited randomly generated games.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 px-4 py-3 bg-[var(--accent)] text-white rounded-xl font-bold"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

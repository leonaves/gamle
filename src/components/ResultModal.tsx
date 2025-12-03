import { useState } from 'react';
import type { GameResult } from '../lib/types';
import { loadStats } from '../lib/storage';
import { getGameEmoji } from '../lib/gameGenerator';

interface Props {
  result: GameResult;
  onClose: () => void;
  onPlayAgain?: () => void;
  isInfinite?: boolean;
}

export function ResultModal({ result, onClose, onPlayAgain, isInfinite }: Props) {
  const [copied, setCopied] = useState(false);
  const stats = loadStats();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Gamle',
          text: result.shareText,
        });
      } else {
        await navigator.clipboard.writeText(result.shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled or error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-sm bg-[var(--bg-primary)] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-8 text-center ${
            result.won ? 'bg-[var(--success)]' : 'bg-[var(--error)]'
          }`}
        >
          <span className="text-5xl">{result.won ? '🎉' : '😔'}</span>
          <h2 className="mt-4 text-2xl font-bold text-white">
            {result.won ? 'You won!' : 'Game Over'}
          </h2>
        </div>

        {/* Stats */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{result.score}</p>
              <p className="text-xs text-[var(--text-muted)]">Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{result.attempts}</p>
              <p className="text-xs text-[var(--text-muted)]">Attempts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {Math.round((result.score / result.maxScore) * 100)}%
              </p>
              <p className="text-xs text-[var(--text-muted)]">Efficiency</p>
            </div>
          </div>

          {/* Game type */}
          <div className="text-center mb-6">
            <span className="text-lg">{getGameEmoji(result.config)}</span>
            <p className="text-sm text-[var(--text-secondary)]">
              {result.config.mechanic} + {result.config.element}
            </p>
          </div>

          {/* Overall stats */}
          {!isInfinite && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl mb-6">
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {stats.currentStreak}
                </p>
                <p className="text-xs text-[var(--text-muted)]">Current Streak</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[var(--text-primary)]">{stats.maxStreak}</p>
                <p className="text-xs text-[var(--text-muted)]">Best Streak</p>
              </div>
            </div>
          )}

          {/* Share preview */}
          <div className="p-4 bg-[var(--bg-secondary)] rounded-xl mb-6 font-mono text-xs whitespace-pre-wrap text-[var(--text-secondary)]">
            {result.shareText}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 px-4 py-3 bg-[var(--accent)] text-white rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-colors"
            >
              {copied ? 'Copied!' : 'Share'}
            </button>
            {isInfinite && onPlayAgain ? (
              <button
                onClick={onPlayAgain}
                className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl font-bold hover:opacity-80 transition-opacity"
              >
                Play Again
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl font-bold hover:opacity-80 transition-opacity"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

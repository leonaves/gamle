import type { DailyProgress, GameResult, GameState } from './types';
import { getDailySeed } from './random';

const STORAGE_KEYS = {
  DAILY_PROGRESS: 'gamle_daily_progress',
  GAME_HISTORY: 'gamle_game_history',
  STATS: 'gamle_stats',
  INFINITE_SEED: 'gamle_infinite_seed',
};

export function saveDailyProgress(state: GameState): void {
  const seed = getDailySeed();
  const date = new Date().toISOString().split('T')[0];
  const progress: DailyProgress = { seed, date, state };
  localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(progress));
}

export function loadDailyProgress(): DailyProgress | null {
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
  if (!stored) return null;

  try {
    const progress: DailyProgress = JSON.parse(stored);
    const todaySeed = getDailySeed();

    // Only return if it's from today
    if (progress.seed === todaySeed) {
      return progress;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveDailyResult(result: GameResult): void {
  const progress = loadDailyProgress();
  if (progress) {
    progress.result = result;
    localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(progress));
  }

  // Also add to history
  const history = loadGameHistory();
  history.push(result);
  localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(history));

  // Update stats
  updateStats(result);
}

export function loadGameHistory(): GameResult[] {
  const stored = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string;
}

export function loadStats(): Stats {
  const stored = localStorage.getItem(STORAGE_KEYS.STATS);
  if (!stored) {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: '',
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: '',
    };
  }
}

function updateStats(result: GameResult): void {
  const stats = loadStats();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  stats.gamesPlayed++;

  if (result.won) {
    stats.gamesWon++;

    if (stats.lastPlayedDate === yesterday) {
      stats.currentStreak++;
    } else if (stats.lastPlayedDate !== today) {
      stats.currentStreak = 1;
    }

    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  stats.lastPlayedDate = today;
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

export function getInfiniteSeed(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.INFINITE_SEED);
  if (stored) {
    return parseInt(stored, 10);
  }
  const seed = Math.floor(Math.random() * 1000000);
  localStorage.setItem(STORAGE_KEYS.INFINITE_SEED, seed.toString());
  return seed;
}

export function nextInfiniteSeed(): number {
  const current = getInfiniteSeed();
  const next = current + 1;
  localStorage.setItem(STORAGE_KEYS.INFINITE_SEED, next.toString());
  return next;
}

export function clearDailyProgress(): void {
  localStorage.removeItem(STORAGE_KEYS.DAILY_PROGRESS);
}

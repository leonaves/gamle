import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { GameContainer } from './components/GameContainer';
import { ResultModal } from './components/ResultModal';
import type { GameConfig, GameState, GameResult } from './lib/types';
import { generateGameConfig, createInitialGameState } from './lib/gameGenerator';
import { getDailySeed } from './lib/random';
import {
  saveDailyProgress,
  loadDailyProgress,
  saveDailyResult,
  getInfiniteSeed,
  nextInfiniteSeed,
} from './lib/storage';

type Mode = 'daily' | 'infinite';

function App() {
  const [mode, setMode] = useState<Mode>('daily');
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Initialize game
  useEffect(() => {
    if (mode === 'daily') {
      const saved = loadDailyProgress();
      if (saved && saved.result) {
        // Already completed today
        setConfig(saved.state.config);
        setState(saved.state);
        setResult(saved.result);
        setShowResult(true);
      } else if (saved) {
        // Resume in progress
        setConfig(saved.state.config);
        setState(saved.state);
        setResult(null);
        setShowResult(false);
      } else {
        // New day, new game
        const seed = getDailySeed();
        const newConfig = generateGameConfig(seed);
        const newState = createInitialGameState(newConfig);
        setConfig(newConfig);
        setState(newState);
        setResult(null);
        setShowResult(false);
      }
    } else {
      // Infinite mode
      const seed = getInfiniteSeed();
      const newConfig = generateGameConfig(seed);
      const newState = createInitialGameState(newConfig);
      setConfig(newConfig);
      setState(newState);
      setResult(null);
      setShowResult(false);
    }
  }, [mode]);

  const handleStateChange = useCallback(
    (newState: GameState) => {
      setState(newState);
      if (mode === 'daily') {
        saveDailyProgress(newState);
      }
    },
    [mode]
  );

  const handleComplete = useCallback(
    (gameResult: GameResult) => {
      setResult(gameResult);
      setShowResult(true);
      if (mode === 'daily') {
        saveDailyResult(gameResult);
      }
    },
    [mode]
  );

  const handleModeChange = useCallback((newMode: Mode) => {
    setMode(newMode);
    setResult(null);
    setShowResult(false);
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (mode === 'infinite') {
      const seed = nextInfiniteSeed();
      const newConfig = generateGameConfig(seed);
      const newState = createInitialGameState(newConfig);
      setConfig(newConfig);
      setState(newState);
      setResult(null);
      setShowResult(false);
    }
  }, [mode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header mode={mode} onModeChange={handleModeChange} />

      <main className="flex-1 flex flex-col items-center py-6">
        {config && state ? (
          <GameContainer
            config={config}
            state={state}
            onStateChange={handleStateChange}
            onComplete={handleComplete}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-[var(--text-muted)]">Loading...</div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
        A new game every day
      </footer>

      {/* Result modal */}
      {showResult && result && (
        <ResultModal
          result={result}
          onClose={() => setShowResult(false)}
          onPlayAgain={mode === 'infinite' ? handlePlayAgain : undefined}
          isInfinite={mode === 'infinite'}
        />
      )}
    </div>
  );
}

export default App;

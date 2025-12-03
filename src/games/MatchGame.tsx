import { useState, useEffect, useCallback } from 'react';
import type { GameConfig, GameState, GameMove } from '../lib/types';
import { createSeededRandom, shuffleArray, pickRandomN } from '../lib/random';
import { COLORS, SHAPES } from '../lib/gameData';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (won: boolean, score: number) => void;
}

interface Card {
  id: number;
  value: string;
  color?: string;
  matched: boolean;
  flipped: boolean;
}

interface MatchData {
  cards: Card[];
  flippedIndices: number[];
  matchedPairs: number;
  totalPairs: number;
}

export function MatchGame({ config, state, onStateChange, onComplete }: Props) {
  const [gameData, setGameData] = useState<MatchData | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Initialize game
  useEffect(() => {
    if (!state.data.initialized) {
      const random = createSeededRandom(config.seed);
      const gridSize = config.difficulty <= 2 ? 4 : config.difficulty <= 4 ? 6 : 8;
      const pairs = (gridSize * gridSize) / 2;

      let items: { value: string; color?: string }[] = [];

      if (config.element === 'colors') {
        const colors = pickRandomN([...COLORS.primary, ...COLORS.extended], pairs, random);
        items = colors.map((c) => ({ value: c.name, color: c.hex }));
      } else if (config.element === 'shapes') {
        const shapes = pickRandomN([...SHAPES.basic, ...SHAPES.extended], pairs, random);
        items = shapes.map((s) => ({ value: s.symbol }));
      } else if (config.element === 'numbers') {
        const nums = shuffleArray(
          Array.from({ length: 20 }, (_, i) => i + 1),
          random
        ).slice(0, pairs);
        items = nums.map((n) => ({ value: n.toString() }));
      } else {
        const patterns = [
          '◐', '◑', '◒', '◓', '▤', '▥', '▦', '▧', '▨', '▩', '◰', '◱', '◲', '◳',
          '◴', '◵', '◶', '◷',
        ];
        items = pickRandomN(patterns, pairs, random).map((p) => ({ value: p }));
      }

      // Create pairs
      const cards: Card[] = [];
      items.forEach((item, idx) => {
        cards.push({ id: idx * 2, value: item.value, color: item.color, matched: false, flipped: false });
        cards.push({ id: idx * 2 + 1, value: item.value, color: item.color, matched: false, flipped: false });
      });

      const shuffledCards = shuffleArray(cards, random);

      const data: MatchData = {
        cards: shuffledCards,
        flippedIndices: [],
        matchedPairs: 0,
        totalPairs: pairs,
      };

      setGameData(data);
      onStateChange({
        ...state,
        started: true,
        maxScore: pairs * 10,
        data: { initialized: true, gridSize },
      });
    }
  }, [config.seed, config.element, config.difficulty, state, onStateChange]);

  const handleCardClick = useCallback(
    (index: number) => {
      if (!gameData || isChecking || state.completed) return;
      const card = gameData.cards[index];
      if (card.flipped || card.matched) return;

      const newCards = [...gameData.cards];
      newCards[index] = { ...card, flipped: true };

      const newFlipped = [...gameData.flippedIndices, index];

      setGameData({ ...gameData, cards: newCards, flippedIndices: newFlipped });

      if (newFlipped.length === 2) {
        setIsChecking(true);
        const [first, second] = newFlipped;
        const card1 = newCards[first];
        const card2 = newCards[second];

        const move: GameMove = {
          type: 'match',
          value: [card1.value, card2.value],
          timestamp: Date.now(),
          correct: card1.value === card2.value,
        };

        setTimeout(() => {
          if (card1.value === card2.value) {
            // Match found
            newCards[first] = { ...card1, matched: true };
            newCards[second] = { ...card2, matched: true };

            const newMatchedPairs = gameData.matchedPairs + 1;
            const completed = newMatchedPairs === gameData.totalPairs;
            const score = (state.score || 0) + 10;

            setGameData({
              ...gameData,
              cards: newCards,
              flippedIndices: [],
              matchedPairs: newMatchedPairs,
            });

            onStateChange({
              ...state,
              score,
              attempts: state.attempts + 1,
              completed,
              won: completed,
              moves: [...state.moves, move],
            });

            if (completed) {
              onComplete(true, score);
            }
          } else {
            // No match
            newCards[first] = { ...card1, flipped: false };
            newCards[second] = { ...card2, flipped: false };

            const attempts = state.attempts + 1;
            const completed = attempts >= state.maxAttempts;

            setGameData({
              ...gameData,
              cards: newCards,
              flippedIndices: [],
            });

            onStateChange({
              ...state,
              attempts,
              completed,
              won: false,
              moves: [...state.moves, move],
            });

            if (completed) {
              onComplete(false, state.score || 0);
            }
          }
          setIsChecking(false);
        }, 600);
      }
    },
    [gameData, isChecking, state, onStateChange, onComplete]
  );

  if (!gameData) return <div className="text-center p-8">Loading...</div>;

  const gridSize = Math.sqrt(gameData.cards.length);
  const cardSize = gridSize <= 4 ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-14 sm:h-14';

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {gameData.cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            disabled={card.matched || card.flipped || isChecking}
            className={`${cardSize} flex items-center justify-center rounded-lg font-bold text-xl transition-all duration-300 ${
              card.matched
                ? 'bg-[var(--success)] text-white opacity-50'
                : card.flipped
                ? 'bg-[var(--bg-primary)] border-2 border-[var(--accent)]'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] cursor-pointer'
            }`}
            style={card.flipped && card.color ? { backgroundColor: card.color } : {}}
          >
            {(card.flipped || card.matched) && !card.color && (
              <span className="animate-pop">{card.value}</span>
            )}
            {!card.flipped && !card.matched && <span className="text-[var(--text-muted)]">?</span>}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
        <span>
          Pairs: {gameData.matchedPairs}/{gameData.totalPairs}
        </span>
        <span>
          Moves: {state.attempts}/{state.maxAttempts}
        </span>
      </div>

      {/* Result */}
      {state.completed && (
        <div className="text-center mt-4 animate-fade-in">
          {state.won ? (
            <p className="text-xl font-bold text-[var(--success)]">
              All pairs found in {state.attempts} moves!
            </p>
          ) : (
            <p className="text-xl font-bold text-[var(--error)]">Out of moves!</p>
          )}
        </div>
      )}
    </div>
  );
}

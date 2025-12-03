import { useCallback } from 'react';
import type { GameConfig, GameState, GameResult } from '../lib/types';
import { getGameDescription, getGameEmoji } from '../lib/gameGenerator';
import { MECHANIC_NAMES, ELEMENT_NAMES, CONSTRAINT_NAMES, MODIFIER_NAMES } from '../lib/types';
import { EMOJIS } from '../lib/gameData';
import {
  GuessGame,
  MatchGame,
  RememberGame,
  ReactGame,
  ArrangeGame,
  DeduceGame,
} from '../games';

interface Props {
  config: GameConfig;
  state: GameState;
  onStateChange: (state: GameState) => void;
  onComplete: (result: GameResult) => void;
}

export function GameContainer({ config, state, onStateChange, onComplete }: Props) {
  const handleComplete = useCallback(
    (won: boolean, score: number) => {
      const shareText = generateShareText(config, state, won, score);
      const result: GameResult = {
        seed: config.seed,
        config,
        won,
        score,
        maxScore: state.maxScore,
        attempts: state.attempts,
        maxAttempts: state.maxAttempts,
        timeElapsed: state.timeElapsed,
        date: new Date().toISOString().split('T')[0],
        shareText,
      };
      onComplete(result);
    },
    [config, state, onComplete]
  );

  const gameProps = {
    config,
    state,
    onStateChange,
    onComplete: handleComplete,
  };

  return (
    <div className="flex flex-col items-center w-full animate-fade-in">
      {/* Game header */}
      <div className="w-full max-w-md px-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{getGameEmoji(config)}</span>
          <h2 className="text-xl font-bold">{getGameDescription(config)}</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded-full">
            {MECHANIC_NAMES[config.mechanic]}
          </span>
          <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded-full">
            {ELEMENT_NAMES[config.element]}
          </span>
          <span className="px-2 py-1 bg-[var(--bg-secondary)] rounded-full">
            {CONSTRAINT_NAMES[config.constraint]}
          </span>
          {config.modifier && (
            <span className="px-2 py-1 bg-[var(--accent)] text-white rounded-full">
              {MODIFIER_NAMES[config.modifier]}
            </span>
          )}
        </div>
      </div>

      {/* Game component */}
      <div className="w-full">
        {config.mechanic === 'guess' && <GuessGame {...gameProps} />}
        {config.mechanic === 'match' && <MatchGame {...gameProps} />}
        {config.mechanic === 'remember' && <RememberGame {...gameProps} />}
        {config.mechanic === 'react' && <ReactGame {...gameProps} />}
        {config.mechanic === 'arrange' && <ArrangeGame {...gameProps} />}
        {config.mechanic === 'deduce' && <DeduceGame {...gameProps} />}
      </div>
    </div>
  );
}

function generateShareText(
  config: GameConfig,
  state: GameState,
  won: boolean,
  score: number
): string {
  const emoji = getGameEmoji(config);
  const date = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  let resultLine = '';
  if (won) {
    if (config.mechanic === 'guess') {
      // For guess games, show the feedback pattern
      const guesses = (state.data.feedback as { status: string }[][]) || [];
      resultLine = guesses
        .map((row) =>
          row
            .map((cell) => {
              if (cell.status === 'correct') return EMOJIS.results.correct;
              if (cell.status === 'present') return EMOJIS.results.partial;
              return EMOJIS.results.wrong;
            })
            .join('')
        )
        .join('\n');
    } else {
      // For other games, show score-based result
      const percentage = score / state.maxScore;
      const stars = Math.ceil(percentage * 5);
      resultLine = Array(stars).fill(EMOJIS.results.star).join('') +
        Array(5 - stars).fill('☆').join('');
    }
  } else {
    resultLine = `${EMOJIS.results.wrong} Better luck tomorrow!`;
  }

  const lines = [
    `Gamle ${emoji} ${date}`,
    '',
    resultLine,
    '',
    won ? `Score: ${score}` : 'Did not complete',
    '',
    'https://gamle.pages.dev',
  ];

  return lines.join('\n');
}

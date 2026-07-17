import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../state/GameContext';
import type { PuzzleDefinition, SignalPuzzleInteraction } from '../../types/game';
import { matchesSignalAnswer } from '../../utils/puzzle';

interface SignalPuzzleProps {
  puzzle: PuzzleDefinition;
  interaction: SignalPuzzleInteraction;
  onSolved: (value: unknown) => void;
}

export const SignalPuzzle = ({ puzzle, interaction, onSolved }: SignalPuzzleProps) => {
  const { state, dispatch } = useGame();
  const stored = state.puzzleProgress[puzzle.id]?.value;
  const [answer, setAnswer] = useState(typeof stored === 'string' ? stored : '');
  const [message, setMessage] = useState('');
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(
    () => () => {
      const context = contextRef.current;
      contextRef.current = null;
      if (context && context.state !== 'closed') void context.close();
    },
    [],
  );

  const playSignal = async () => {
    if (!state.settings.audio.enabled) {
      setMessage('Звук выключен в настройках. Визуальная дорожка содержит те же сигналы.');
      return;
    }
    contextRef.current ??= new AudioContext();
    const context = contextRef.current;
    await context.resume();
    let cursor = context.currentTime + 0.06;
    interaction.groups.forEach((group) => {
      group.forEach((token) => {
        const duration = token === 'short' ? 0.11 : 0.28;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 560;
        gain.gain.setValueAtTime(0.0001, cursor);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, 0.05 * state.settings.audio.volume),
          cursor + 0.01,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(cursor);
        oscillator.stop(cursor + duration + 0.02);
        cursor += duration + 0.09;
      });
      cursor += 0.35;
    });
  };

  const verify = () => {
    if (matchesSignalAnswer(answer, interaction.acceptedAnswers)) {
      onSolved(answer);
    } else {
      setMessage('Расшифровка пока не совпадает с полной последовательностью групп.');
    }
  };

  return (
    <div className="signal-puzzle">
      <div className="waveform" aria-label={`Визуальная запись: ${interaction.transcript}`}>
        {interaction.groups.map((group, groupIndex) => (
          <div className="waveform__group" key={`${puzzle.id}-group-${groupIndex}`}>
            {group.map((token, tokenIndex) => (
              <span
                className={`waveform__pulse waveform__pulse--${token}`}
                key={`${token}-${tokenIndex}`}
                aria-label={token === 'short' ? 'короткий сигнал' : 'длинный сигнал'}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="visual-transcript">
        <strong>Визуальная расшифровка:</strong> {interaction.transcript}
      </p>
      <button className="button button--quiet" onClick={() => void playSignal()}>
        <span aria-hidden="true">▶</span> Воспроизвести сигнал
      </button>
      <label className="field">
        <span>Команда из таблицы</span>
        <input
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setMessage('');
            dispatch({ type: 'SET_PUZZLE_VALUE', puzzleId: puzzle.id, value: event.target.value });
          }}
          autoComplete="off"
        />
      </label>
      {message ? <p className="puzzle-message puzzle-message--wrong" role="status">{message}</p> : null}
      <button className="button button--primary" onClick={verify}>
        Проверить расшифровку
      </button>
    </div>
  );
};

import { useState, type DragEvent } from 'react';
import { useGame } from '../../state/GameContext';
import type { PuzzleDefinition, ReconstructionPuzzleInteraction } from '../../types/game';
import { isExactSequence } from '../../utils/puzzle';

interface ReconstructionPuzzleProps {
  puzzle: PuzzleDefinition;
  interaction: ReconstructionPuzzleInteraction;
  onSolved: (value: unknown) => void;
}

const isStringOrNullArray = (value: unknown): value is Array<string | null> =>
  Array.isArray(value) && value.every((item) => item === null || typeof item === 'string');

export const ReconstructionPuzzle = ({
  puzzle,
  interaction,
  onSolved,
}: ReconstructionPuzzleProps) => {
  const { state, dispatch } = useGame();
  const stored = state.puzzleProgress[puzzle.id]?.value;
  const initial =
    isStringOrNullArray(stored) && stored.length === interaction.slots.length
      ? stored
      : interaction.slots.map(() => null);
  const [placed, setPlaced] = useState<Array<string | null>>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const place = (fragmentId: string, slotIndex: number) => {
    const next = placed.map((item) => (item === fragmentId ? null : item));
    next[slotIndex] = fragmentId;
    setPlaced(next);
    setSelected(null);
    setMessage('');
    dispatch({ type: 'SET_PUZZLE_VALUE', puzzleId: puzzle.id, value: next });
  };

  const clearSlot = (slotIndex: number) => {
    const next = [...placed];
    next[slotIndex] = null;
    setPlaced(next);
    setSelected(null);
    setMessage('');
    dispatch({ type: 'SET_PUZZLE_VALUE', puzzleId: puzzle.id, value: next });
  };

  const clearAll = () => {
    const next = interaction.slots.map(() => null);
    setPlaced(next);
    setSelected(null);
    setMessage('');
    dispatch({ type: 'SET_PUZZLE_VALUE', puzzleId: puzzle.id, value: next });
  };

  const drop = (event: DragEvent, slotIndex: number) => {
    event.preventDefault();
    const fragmentId = event.dataTransfer.getData('text/plain');
    if (interaction.fragments.some((fragment) => fragment.id === fragmentId)) {
      place(fragmentId, slotIndex);
    }
  };

  const verify = () => {
    if (isExactSequence(placed.map((item) => item ?? ''), interaction.correctSlotOrder)) {
      onSolved(placed);
    } else {
      setMessage('Некоторые строки или линии сгиба пока не продолжаются через разрыв.');
    }
  };

  return (
    <div className="reconstruction-puzzle">
      <div className="fragment-bank" aria-label="Фрагменты документа">
        {interaction.fragments.map((fragment) => {
          const inUse = placed.includes(fragment.id);
          return (
            <button
              key={fragment.id}
              className={`paper-fragment ${selected === fragment.id ? 'paper-fragment--selected' : ''}`}
              draggable
              aria-pressed={selected === fragment.id}
              disabled={inUse}
              onDragStart={(event) => event.dataTransfer.setData('text/plain', fragment.id)}
              onClick={() => setSelected(fragment.id)}
            >
              <strong>{fragment.label}</strong>
              <span>{fragment.text}</span>
            </button>
          );
        })}
      </div>
      <div
        className={`document-grid ${interaction.slots.length > 8 ? 'document-grid--wide' : ''}`}
        aria-label="Поле сборки документа"
      >
        {interaction.slots.map((slot, index) => {
          const fragment = interaction.fragments.find((item) => item.id === placed[index]);
          return (
            <button
              key={slot.id}
              className={`document-slot ${fragment ? 'document-slot--filled' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => drop(event, index)}
              onClick={() => {
                if (selected) place(selected, index);
                else if (fragment) clearSlot(index);
              }}
              aria-label={`${slot.label}${fragment ? `: ${fragment.label}` : ': пусто'}`}
            >
              {fragment ? (
                <>
                  <strong>{fragment.label}</strong>
                  <span>{fragment.text}</span>
                </>
              ) : (
                <span>{slot.label}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="input-help">Выберите фрагмент и ячейку или перетащите его мышью. Нажмите заполненную ячейку, чтобы вернуть фрагмент.</p>
      {message ? <p className="puzzle-message puzzle-message--wrong" role="status">{message}</p> : null}
      <div className="puzzle-actions">
        <button className="button button--primary" onClick={verify}>
          Проверить сборку
        </button>
        <button className="button" onClick={clearAll} disabled={!placed.some(Boolean)}>
          Очистить поле
        </button>
      </div>
    </div>
  );
};

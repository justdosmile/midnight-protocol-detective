import { useMemo, useState, type DragEvent } from 'react';
import { useGame } from '../../state/GameContext';
import type { PuzzleDefinition, SequencePuzzleInteraction } from '../../types/game';
import { isExactSequence, reorder } from '../../utils/puzzle';

interface SequencePuzzleProps {
  puzzle: PuzzleDefinition;
  interaction: SequencePuzzleInteraction;
  onSolved: (value: unknown) => void;
}

export const SequencePuzzle = ({ puzzle, interaction, onSolved }: SequencePuzzleProps) => {
  const { state, dispatch } = useGame();
  const storedValue = state.puzzleProgress[puzzle.id]?.value;
  const storedOrder = Array.isArray(storedValue)
    ? storedValue.filter((value): value is string => typeof value === 'string')
    : [];
  const configuredOrder =
    interaction.initialOrder?.length === interaction.items.length
      ? interaction.initialOrder
      : interaction.items.map((item) => item.id);
  const initialOrder =
    storedOrder.length === interaction.items.length
      ? storedOrder
      : configuredOrder;
  const [order, setOrder] = useState(initialOrder);
  const [message, setMessage] = useState('');
  const itemById = useMemo(
    () => new Map(interaction.items.map((item) => [item.id, item])),
    [interaction.items],
  );

  const updateOrder = (next: string[]) => {
    setOrder(next);
    setMessage('');
    dispatch({ type: 'SET_PUZZLE_VALUE', puzzleId: puzzle.id, value: next });
  };

  const move = (index: number, direction: -1 | 1) => {
    updateOrder(reorder(order, index, index + direction));
  };

  const dropAt = (event: DragEvent, targetIndex: number) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain');
    const sourceIndex = order.indexOf(sourceId);
    if (sourceIndex >= 0) updateOrder(reorder(order, sourceIndex, targetIndex));
  };

  const verify = () => {
    if (isExactSequence(order, interaction.correctOrder)) {
      onSolved(order);
    } else {
      setMessage('Порядок пока противоречит хотя бы одной детали. Сверьте независимые признаки.');
    }
  };

  return (
    <div className="sequence-puzzle">
      <ol className="sequence-list" aria-label="Порядок кадров">
        {order.map((id, index) => {
          const item = itemById.get(id);
          if (!item) return null;
          return (
            <li
              key={id}
              className="sequence-card"
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/plain', id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropAt(event, index)}
            >
              <span className="sequence-card__index">{index + 1}</span>
              {item.image ? <img src={item.image} alt={item.imageAlt ?? ''} /> : null}
              <div>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </div>
              <div className="sequence-card__controls" aria-label={`Переместить ${item.label}`}>
                <button
                  className="icon-button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Переместить раньше"
                >
                  ↑
                </button>
                <button
                  className="icon-button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label="Переместить позже"
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {message ? <p className="puzzle-message puzzle-message--wrong" role="status">{message}</p> : null}
      <button className="button button--primary" onClick={verify}>
        Проверить последовательность
      </button>
    </div>
  );
};

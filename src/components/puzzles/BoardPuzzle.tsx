import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import type { BoardPuzzleInteraction, PuzzleDefinition } from '../../types/game';
import { hasRequiredTheoryEvidence } from '../../utils/puzzle';
import { EvidenceBoard } from './EvidenceBoard';

interface BoardPuzzleProps {
  puzzle: PuzzleDefinition;
  interaction: BoardPuzzleInteraction;
  onSolved: (value: unknown) => void;
}

export const BoardPuzzle = ({ interaction, onSolved }: BoardPuzzleProps) => {
  const { state } = useGame();
  const [message, setMessage] = useState('');

  const verify = () => {
    if (
      state.theoryEvidenceIds.length >= interaction.minimumEvidence &&
      hasRequiredTheoryEvidence(state.theoryEvidenceIds, interaction.requiredGroups)
    ) {
      onSolved(state.theoryEvidenceIds);
    } else {
      setMessage(
        'Версия пока не соединяет независимые сведения о времени, маршруте и происхождении записи.',
      );
    }
  };

  return (
    <div>
      <EvidenceBoard
        compact
        theoryGroups={interaction.requiredGroups.map((ids, index) => ({
          label: ['Время', 'Источник голоса', 'Пульт', 'Второй человек', 'Физические следы', 'Возможность', 'Мотив'][index] ?? `Цепочка ${index + 1}`,
          ids,
        }))}
      />
      {message ? <p className="puzzle-message puzzle-message--wrong" role="status">{message}</p> : null}
      <button className="button button--primary" onClick={verify}>
        Проверить версию
      </button>
    </div>
  );
};

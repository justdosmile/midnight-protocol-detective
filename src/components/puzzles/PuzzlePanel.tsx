import { useEffect, useRef, useState } from 'react';
import { useAmbience } from '../../audio/AmbienceProvider';
import { useGame } from '../../state/GameContext';
import { requiredMaterialsViewed } from '../../state/chapterProgress';
import type { PuzzleDefinition } from '../../types/game';
import { BoardPuzzle } from './BoardPuzzle';
import { PhotoPuzzle } from './PhotoPuzzle';
import { ReconstructionPuzzle } from './ReconstructionPuzzle';
import { SequencePuzzle } from './SequencePuzzle';
import { SignalPuzzle } from './SignalPuzzle';

interface PuzzlePanelProps {
  puzzle: PuzzleDefinition;
}

export const PuzzlePanel = ({ puzzle }: PuzzlePanelProps) => {
  const { state, dispatch } = useGame();
  const { playUiSound } = useAmbience();
  const [justSolved, setJustSolved] = useState(false);
  const solvedHeadingRef = useRef<HTMLHeadingElement>(null);
  const progress = state.puzzleProgress[puzzle.id];
  const ready = requiredMaterialsViewed(state, puzzle.requiredMaterialIds);

  const solve = (value: unknown) => {
    dispatch({ type: 'SOLVE_PUZZLE', puzzleId: puzzle.id, value });
    playUiSound('success');
    setJustSolved(true);
  };

  useEffect(() => {
    if (justSolved) solvedHeadingRef.current?.focus();
  }, [justSolved]);

  if (progress?.solved || justSolved) {
    return (
      <section className="puzzle-panel puzzle-panel--solved" aria-labelledby={`${puzzle.id}-title`} role="status">
        <p className="eyebrow">Задача решена</p>
        <h3 ref={solvedHeadingRef} tabIndex={-1} id={`${puzzle.id}-title`}>{puzzle.title}</h3>
        <p>{puzzle.successText}</p>
      </section>
    );
  }

  return (
    <section className="puzzle-panel" aria-labelledby={`${puzzle.id}-title`}>
      <header className="puzzle-panel__header">
        <div>
          <p className="eyebrow">Интерактивная задача</p>
          <h3 id={`${puzzle.id}-title`}>{puzzle.title}</h3>
          <p>{puzzle.description}</p>
        </div>
        <span className={ready ? 'status-chip status-chip--ready' : 'status-chip'}>
          {ready ? 'готово к решению' : 'сначала изучите материалы'}
        </span>
      </header>
      {ready ? (
        <div className="puzzle-panel__interaction">
          {puzzle.interaction.type === 'sequence' ? (
            <SequencePuzzle puzzle={puzzle} interaction={puzzle.interaction} onSolved={solve} />
          ) : null}
          {puzzle.interaction.type === 'signal' ? (
            <SignalPuzzle puzzle={puzzle} interaction={puzzle.interaction} onSolved={solve} />
          ) : null}
          {puzzle.interaction.type === 'reconstruction' ? (
            <ReconstructionPuzzle
              puzzle={puzzle}
              interaction={puzzle.interaction}
              onSolved={solve}
            />
          ) : null}
          {puzzle.interaction.type === 'photo' ? (
            <PhotoPuzzle puzzle={puzzle} interaction={puzzle.interaction} onSolved={solve} />
          ) : null}
          {puzzle.interaction.type === 'board' ? (
            <BoardPuzzle puzzle={puzzle} interaction={puzzle.interaction} onSolved={solve} />
          ) : null}
        </div>
      ) : (
        <div className="locked-panel">
          <span aria-hidden="true">⌁</span>
          <p>Откройте материалы с обязательной отметкой, чтобы разблокировать действие.</p>
        </div>
      )}
    </section>
  );
};

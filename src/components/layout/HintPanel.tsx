import { useGame } from '../../state/GameContext';
import type { PuzzleId } from '../../types/game';

interface HintPanelProps {
  puzzleId: PuzzleId | null;
}

export const HintPanel = ({ puzzleId }: HintPanelProps) => {
  const { state, dispatch, content } = useGame();
  const hintSet = content.hints.find((item) => item.puzzleId === puzzleId);
  const progress = puzzleId ? state.puzzleProgress[puzzleId] : null;

  return (
    <section className="tool-panel" aria-labelledby="hints-title">
      <header className="tool-panel__header">
        <div>
          <p className="eyebrow">Без ожидания</p>
          <h2 id="hints-title">Подсказки</h2>
        </div>
        <span>{progress?.hintsRevealed ?? 0}/3</span>
      </header>
      {!hintSet || !progress ? (
        <p className="muted">В этой главе нет активной головоломки.</p>
      ) : (
        <>
          <ol className="hint-list">
            {hintSet.hints.slice(0, progress.hintsRevealed).map((hint, index) => (
              <li key={hint}>
                <span>{index + 1}</span>
                <p>{hint}</p>
              </li>
            ))}
          </ol>
          {progress.solutionShown ? (
            <div className="solution-nudge" role="status">
              <strong>Решение шага</strong>
              <p>{hintSet.solutionNudge}</p>
            </div>
          ) : null}
          {progress.hintsRevealed < 3 ? (
            <button
              className="button button--quiet button--full"
              onClick={() => dispatch({ type: 'REVEAL_HINT', puzzleId: hintSet.puzzleId })}
            >
              Открыть подсказку {progress.hintsRevealed + 1}
            </button>
          ) : !progress.solutionShown ? (
            <button
              className="button button--quiet button--full"
              onClick={() =>
                dispatch({ type: 'SHOW_PUZZLE_SOLUTION', puzzleId: hintSet.puzzleId })
              }
            >
              Показать решение этого шага
            </button>
          ) : null}
        </>
      )}
    </section>
  );
};

import { useGame } from '../../state/GameContext';
import { HintPanel } from './HintPanel';
import { Notebook } from './Notebook';

export const RightRail = () => {
  const { state, content } = useGame();
  const activePuzzles = content.puzzles.filter(
    (puzzle) => puzzle.chapterId === state.activeChapterId,
  );
  const unresolved = activePuzzles.find((puzzle) => !state.puzzleProgress[puzzle.id]?.solved);
  return (
    <aside className="right-rail" aria-label="Инструменты следователя">
      <Notebook />
      <HintPanel puzzleId={unresolved?.id ?? activePuzzles.at(-1)?.id ?? null} />
    </aside>
  );
};

import { useGame } from '../../state/GameContext';
import type { Suspect } from '../../types/game';

interface SidebarProps {
  onSelectSuspect: (suspect: Suspect) => void;
}

export const Sidebar = ({ onSelectSuspect }: SidebarProps) => {
  const { state, dispatch, content } = useGame();

  return (
    <aside className="sidebar" aria-label="Навигация по делу">
      <nav className="chapter-nav" aria-labelledby="chapters-nav-title">
        <p className="sidebar__label" id="chapters-nav-title">
          Главы дела
        </p>
        <ol>
          {content.chapters.map((chapter, chapterIndex) => {
            const unlocked = state.unlockedChapterIds.includes(chapter.id);
            const active = state.activeChapterId === chapter.id;
            const chapterPuzzles = content.puzzles.filter(
              (puzzle) => puzzle.chapterId === chapter.id,
            );
            const nextChapter = content.chapters[chapterIndex + 1];
            const completed = chapterPuzzles.length
              ? chapterPuzzles.every((puzzle) => state.puzzleProgress[puzzle.id]?.solved)
              : Boolean(nextChapter && state.unlockedChapterIds.includes(nextChapter.id));
            return (
              <li key={chapter.id}>
                <button
                  onClick={() => dispatch({ type: 'SELECT_CHAPTER', chapterId: chapter.id })}
                  disabled={!unlocked}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{String(chapter.number).padStart(2, '0')}</span>
                  <span>
                    <strong>{chapter.title}</strong>
                    <small>{unlocked ? (completed ? 'завершено' : chapter.subtitle) : 'закрыто'}</small>
                  </span>
                  <span aria-hidden="true">{completed ? '✓' : unlocked ? '›' : '·'}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <section className="suspect-nav" aria-labelledby="suspects-nav-title">
        <p className="sidebar__label" id="suspects-nav-title">
          Участники
        </p>
        <div className="suspect-nav__list">
          {content.suspects.map((suspect) => (
            <button key={suspect.id} onClick={() => onSelectSuspect(suspect)}>
              <img src={suspect.portrait} alt="" />
              <span>
                <strong>{suspect.name}</strong>
                <small>{suspect.role}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
};

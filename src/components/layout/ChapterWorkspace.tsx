import { useEffect, useRef } from 'react';
import { useGame } from '../../state/GameContext';
import { getNextChapterId, requiredMaterialsViewed } from '../../state/chapterProgress';
import { selectActiveChapter } from '../../state/selectors';
import type { Material, PuzzleDefinition } from '../../types/game';
import { PuzzlePanel } from '../puzzles/PuzzlePanel';

export const ChapterWorkspace = () => {
  const { state, dispatch, content } = useGame();
  const chapter = selectActiveChapter(state, content);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [chapter?.id]);
  if (!chapter) return null;
  const materials = chapter.materialIds
    .map((id) => content.materials.find((material) => material.id === id))
    .filter((material): material is Material => Boolean(material));
  const puzzles = chapter.puzzleIds
    .map((id) => content.puzzles.find((puzzle) => puzzle.id === id))
    .filter((puzzle): puzzle is PuzzleDefinition => Boolean(puzzle));
  const nextChapterId = getNextChapterId(content, chapter.id);
  const introComplete = !puzzles.length && requiredMaterialsViewed(state, chapter.materialIds);

  const completeIntro = () => {
    dispatch({ type: 'COMPLETE_CHAPTER', chapterId: chapter.id });
    if (nextChapterId) dispatch({ type: 'SELECT_CHAPTER', chapterId: nextChapterId });
  };

  return (
    <div className="chapter-workspace">
      <header className="chapter-hero">
        <div>
          <p className="eyebrow">Глава {chapter.number} / {chapter.estimatedMinutes}</p>
          <h1 ref={headingRef} tabIndex={-1}>{chapter.title}</h1>
          <p>{chapter.objective}</p>
        </div>
        <div className="chapter-hero__index" aria-hidden="true">
          {String(chapter.number).padStart(2, '0')}
        </div>
      </header>

      {chapter.number === 1 ? (
        <section className="quick-guide" aria-labelledby="guide-title">
          <div>
            <p className="eyebrow">Первые шаги</p>
            <h2 id="guide-title">Как вести дело</h2>
          </div>
          <ol>
            <li><span>1</span><p><strong>Открывайте материалы</strong> в карточках ниже.</p></li>
            <li><span>2</span><p><strong>Проверяйте участников</strong> в левой панели.</p></li>
            <li><span>3</span><p><strong>Записывайте версии</strong> в блокнот справа.</p></li>
            <li><span>4</span><p><strong>Подсказки</strong> всегда доступны и не блокируют финал.</p></li>
          </ol>
          <p className="quick-guide__goal">Общая цель: проверить время, звонки, маршруты и следы, а затем назвать преступника.</p>
        </section>
      ) : null}

      <section className="materials-section" aria-labelledby="materials-title">
        <header className="section-header">
          <div>
            <p className="eyebrow">Архив дела</p>
            <h2 id="materials-title">Материалы главы</h2>
          </div>
          <span>{materials.filter((material) => state.viewedMaterialIds.includes(material.id)).length}/{materials.length} изучено</span>
        </header>
        <div className="material-grid">
          {materials.map((material) => {
            const unlocked = state.unlockedMaterialIds.includes(material.id);
            const viewed = state.viewedMaterialIds.includes(material.id);
            const starred = state.starredEvidenceIds.includes(material.id);
            return (
              <article
                className={`material-card ${viewed ? 'material-card--viewed' : ''} ${!unlocked ? 'material-card--locked' : ''}`}
                key={material.id}
              >
                {material.image && unlocked ? (
                  <div className="material-card__thumb">
                    <img src={material.image} alt="" />
                  </div>
                ) : (
                  <div className="material-card__glyph" aria-hidden="true">
                    {unlocked ? '⌁' : '×'}
                  </div>
                )}
                <div className="material-card__body">
                  <div className="material-card__meta">
                    <span>{material.eyebrow}</span>
                    {material.isRequired ? <span>обязательно</span> : null}
                    {starred ? <span aria-label="Отмечено как важное">★</span> : null}
                  </div>
                  <h3>{material.title}</h3>
                  <p>{unlocked ? material.summary : 'Материал откроется после решения текущей задачи.'}</p>
                  <button
                    className="text-button"
                    disabled={!unlocked}
                    onClick={() => dispatch({ type: 'OPEN_MATERIAL', materialId: material.id })}
                  >
                    {unlocked ? (viewed ? 'Открыть снова' : 'Изучить материал') : 'Доступ закрыт'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {puzzles.map((puzzle) => (
        <PuzzlePanel puzzle={puzzle} key={puzzle.id} />
      ))}

      {!puzzles.length ? (
        <section className="chapter-transition">
          <p>{introComplete ? 'Вводные материалы изучены. Пора восстановить порядок вечера.' : 'Изучите все материалы главы, чтобы открыть следующий раздел.'}</p>
          <button className="button button--primary" disabled={!introComplete} onClick={completeIntro}>
            Перейти к главе 2
          </button>
        </section>
      ) : null}
    </div>
  );
};

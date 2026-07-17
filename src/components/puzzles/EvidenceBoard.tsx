import { useMemo, useState, type DragEvent } from 'react';
import { useGame } from '../../state/GameContext';
import type { EvidenceFilters, Material } from '../../types/game';
import { filterEvidence } from '../../utils/evidenceFilter';

const emptyFilters: EvidenceFilters = {
  query: '',
  suspectId: '',
  location: '',
  timeLabel: '',
  starredOnly: false,
};

const locationNames: Record<string, string> = {
  house: 'Дом',
  foyer: 'Прихожая',
  'living-room': 'Гостиная',
  library: 'Библиотека',
  kitchen: 'Кухня',
  attic: 'Чердак',
  'winter-garden': 'Зимний сад',
  'guest-wing': 'Гостевой флигель',
  woodshed: 'Дровник',
  path: 'Старый мосток',
};

interface EvidenceBoardProps {
  compact?: boolean;
  theoryGroups?: Array<{ label: string; ids: string[] }>;
}

export const EvidenceBoard = ({ compact = false, theoryGroups = [] }: EvidenceBoardProps) => {
  const { state, dispatch, content } = useGame();
  const [filters, setFilters] = useState(emptyFilters);
  const available = useMemo(
    () => {
      const unlocked = new Set(state.unlockedMaterialIds);
      return filterEvidence(
        content.materials.filter((material) => unlocked.has(material.id)),
        filters,
        state.starredEvidenceIds,
      );
    },
    [content.materials, filters, state.starredEvidenceIds, state.unlockedMaterialIds],
  );
  const theory = state.theoryEvidenceIds
    .map((id) => content.materials.find((material) => material.id === id))
    .filter((material): material is Material => Boolean(material));
  const groupedIds = new Set(theoryGroups.flatMap((group) => group.ids));
  const ungroupedTheory = theory.filter((material) => !groupedIds.has(material.id));
  const locations = [...new Set(content.materials.flatMap((material) => material.locations))];
  const timeLabels = [...new Set(content.materials.flatMap((material) => material.timeLabels))];

  const addToTheory = (materialId: string) => {
    if (!state.theoryEvidenceIds.includes(materialId)) {
      dispatch({ type: 'TOGGLE_THEORY', materialId });
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const materialId = event.dataTransfer.getData('text/plain');
    if (content.materials.some((material) => material.id === materialId)) addToTheory(materialId);
  };

  return (
    <div className={`evidence-board ${compact ? 'evidence-board--compact' : ''}`}>
      <div className="evidence-board__catalog">
        <div className="evidence-filters" aria-label="Фильтры улик">
          <label className="field field--search">
            <span className="sr-only">Поиск по уликам</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              placeholder="Поиск по материалам"
            />
          </label>
          <label>
            <span className="sr-only">Человек</span>
            <select
              value={filters.suspectId}
              onChange={(event) => setFilters({ ...filters, suspectId: event.target.value })}
            >
              <option value="">Все участники</option>
              {content.suspects.map((suspect) => (
                <option value={suspect.id} key={suspect.id}>
                  {suspect.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Место</span>
            <select
              value={filters.location}
              onChange={(event) =>
                setFilters({ ...filters, location: event.target.value })
              }
            >
              <option value="">Все места</option>
              {locations.map((location) => (
                <option value={location} key={location}>
                  {locationNames[location] ?? location}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Время</span>
            <select
              value={filters.timeLabel}
              onChange={(event) => setFilters({ ...filters, timeLabel: event.target.value })}
            >
              <option value="">Любое время</option>
              {timeLabels.map((time) => (
                <option value={time} key={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={filters.starredOnly}
              onChange={(event) => setFilters({ ...filters, starredOnly: event.target.checked })}
            />
            Только важные
          </label>
        </div>
        <div className="evidence-card-grid">
          {available.length ? (
            available.map((material) => {
              const inTheory = state.theoryEvidenceIds.includes(material.id);
              return (
                <article
                  key={material.id}
                  className="evidence-card"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', material.id)}
                >
                  <div>
                    <span>{material.eyebrow}</span>
                    <h4>{material.title}</h4>
                    <p>{material.summary}</p>
                  </div>
                  <div className="evidence-card__actions">
                    <button
                      className="text-button"
                      onClick={() => dispatch({ type: 'OPEN_MATERIAL', materialId: material.id })}
                    >
                      Открыть
                    </button>
                    <button
                      className="text-button"
                      onClick={() =>
                        dispatch({ type: 'TOGGLE_THEORY', materialId: material.id })
                      }
                    >
                      {inTheory ? 'Убрать' : 'В версию'}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="empty-state">По этим фильтрам материалов не найдено.</p>
          )}
        </div>
      </div>
      <section
        className="theory-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        aria-labelledby="theory-title"
      >
        <header>
          <p className="eyebrow">Рабочая гипотеза</p>
          <h3 id="theory-title">Версия следствия</h3>
          <p>Перетащите сюда ключевые материалы или используйте кнопку «В версию».</p>
        </header>
        {theoryGroups.length ? (
          <div className="theory-chain-grid">
            {theoryGroups.map((group) => {
              const materials = group.ids
                .map((id) => theory.find((material) => material.id === id))
                .filter((material): material is Material => Boolean(material));
              return (
                <section className="theory-chain" key={group.label} aria-label={`Цепочка: ${group.label}`}>
                  <h4>{group.label} <span>{materials.length}/{group.ids.length}</span></h4>
                  <ul>
                    {materials.map((material) => (
                      <li key={material.id}>
                        <button onClick={() => dispatch({ type: 'OPEN_MATERIAL', materialId: material.id })}>{material.title}</button>
                        <button className="icon-button" onClick={() => dispatch({ type: 'TOGGLE_THEORY', materialId: material.id })} aria-label={`Убрать ${material.title} из версии`}>×</button>
                      </li>
                    ))}
                  </ul>
                  {!materials.length ? <p>Нет связанной улики</p> : null}
                </section>
              );
            })}
            {ungroupedTheory.length ? (
              <section className="theory-chain theory-chain--other" aria-label="Прочие материалы">
                <h4>Прочие <span>{ungroupedTheory.length}</span></h4>
                <ul>
                  {ungroupedTheory.map((material) => (
                    <li key={material.id}>
                      <button onClick={() => dispatch({ type: 'OPEN_MATERIAL', materialId: material.id })}>{material.title}</button>
                      <button className="icon-button" onClick={() => dispatch({ type: 'TOGGLE_THEORY', materialId: material.id })} aria-label={`Убрать ${material.title} из версии`}>×</button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : (
          <ul>
            {theory.map((material) => (
              <li key={material.id}>
                <button onClick={() => dispatch({ type: 'OPEN_MATERIAL', materialId: material.id })}>{material.title}</button>
                <button className="icon-button" onClick={() => dispatch({ type: 'TOGGLE_THEORY', materialId: material.id })} aria-label={`Убрать ${material.title} из версии`}>×</button>
              </li>
            ))}
          </ul>
        )}
        {!theory.length ? <p className="theory-zone__empty">Поле пока пусто</p> : null}
      </section>
    </div>
  );
};

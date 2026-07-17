import { useGame } from '../../state/GameContext';

export const Notebook = () => {
  const { state, dispatch, saveAvailable } = useGame();
  return (
    <section className="tool-panel" aria-labelledby="notebook-title">
      <header className="tool-panel__header">
        <div>
          <p className="eyebrow">Личные записи</p>
          <h2 id="notebook-title">Блокнот</h2>
        </div>
        <span className="autosave-label" role="status">
          {saveAvailable ? 'автосохранение' : 'сохранение недоступно'}
        </span>
      </header>
      <label className="sr-only" htmlFor="investigator-notes">
        Заметки команды
      </label>
      <textarea
        id="investigator-notes"
        className="notebook"
        value={state.notes}
        onChange={(event) => dispatch({ type: 'SET_NOTES', notes: event.target.value })}
        placeholder="Фиксируйте версии, несоответствия и вопросы к алиби…"
      />
    </section>
  );
};

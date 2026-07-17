import { useState, type FormEvent } from 'react';
import { useAmbience } from '../audio/AmbienceProvider';
import { useGame } from '../state/GameContext';
import { formatElapsedTime, selectHintsUsed } from '../state/selectors';
import type { RevealedSolution } from '../types/game';
import { decryptAnySolution } from '../utils/crypto';
import { Modal } from './modals/Modal';

interface FinalAccusationProps {
  onRestart: () => void;
}

// Начинаем загрузку локального зашифрованного досье вместе с интерфейсом, чтобы
// финальная проверка продолжала работать после отключения сети.
const solutionBundlePromise = import('../data/solutionBundle.generated');

export const FinalAccusation = ({ onRestart }: FinalAccusationProps) => {
  const { state, dispatch, content } = useGame();
  const { playUiSound } = useAmbience();
  const [name, setName] = useState('');
  const [motive, setMotive] = useState('');
  const [method, setMethod] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [solution, setSolution] = useState<RevealedSolution | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || isChecking) return;
    setIsChecking(true);
    setMessage('');
    try {
      const { encryptedSolutionBundles } = await solutionBundlePromise;
      const revealed = await decryptAnySolution(name, encryptedSolutionBundles);
      if (revealed) {
        dispatch({ type: 'FINISH_GAME', now: Date.now() });
        playUiSound('finale');
        setSolution(revealed);
      } else {
        setMessage(
          'Версия пока не сходится. Проверьте время, звонки, маршрут, следы и мотив.',
        );
      }
    } catch {
      setMessage(
        'Защищённое досье не удалось прочитать. Обновите страницу: сохранённый прогресс останется на месте.',
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <section className="accusation-panel" aria-labelledby="accusation-title">
        <div>
          <p className="eyebrow">Итоговая версия</p>
          <h2 id="accusation-title">Кто совершил преступление?</h2>
          <p>Назовите человека, который объясняет все пять цепочек на доске.</p>
        </div>
        <form onSubmit={(event) => void submit(event)}>
          <label className="field">
            <span>Имя преступника <b aria-hidden="true">*</b></span>
            <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="off" />
          </label>
          <label className="field">
            <span>Мотив <small>необязательно</small></span>
            <textarea value={motive} onChange={(event) => setMotive(event.target.value)} />
          </label>
          <label className="field">
            <span>Как это произошло <small>необязательно</small></span>
            <textarea value={method} onChange={(event) => setMethod(event.target.value)} />
          </label>
          {message ? <p className="puzzle-message puzzle-message--wrong" role="status">{message}</p> : null}
          <button className="button button--primary" disabled={!name.trim() || isChecking}>
            {isChecking ? 'Сверяем досье…' : 'Предъявить обвинение'}
          </button>
        </form>
      </section>

      {solution ? (
        <Modal
          title={solution.title}
          eyebrow="Дело раскрыто"
          size="wide"
          onClose={() => undefined}
          dismissible={false}
        >
          <article className="revelation">
            <div className="revelation__signal" aria-hidden="true"><span /><span /><span /></div>
            <p className="revelation__name">{solution.culpritDisplayName}</p>
            <img
              className="revelation__art"
              src={`${import.meta.env.BASE_URL}assets/final-evidence-table.webp`}
              alt="Стол следователя с фотографиями дома, следом обуви, запиской и пуговицей"
            />
            {solution.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <section>
              <h3>Решающие улики</h3>
              <ol>{solution.decisiveEvidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ol>
            </section>
            <section>
              <h3>После дела</h3>
              <div className="epilogue-grid">
                {solution.epilogues.map((epilogue) => (
                  <div key={epilogue.name}><strong>{epilogue.name}</strong><p>{epilogue.text}</p></div>
                ))}
              </div>
            </section>
            <dl className="final-stats">
              <div><dt>Время</dt><dd>{formatElapsedTime(state.elapsedSeconds)}</dd></div>
              <div><dt>Подсказки</dt><dd>{selectHintsUsed(state)}</dd></div>
              <div><dt>Материалы</dt><dd>{state.viewedMaterialIds.length}/{content.materials.length}</dd></div>
            </dl>
            <button className="button button--primary" onClick={onRestart}>Начать новое расследование</button>
          </article>
        </Modal>
      ) : null}
    </>
  );
};

import { useAmbience } from '../../audio/AmbienceProvider';
import { useGame } from '../../state/GameContext';

interface StartScreenProps {
  onStart: () => void;
  onNewGame: () => void;
}

export const StartScreen = ({ onStart, onNewGame }: StartScreenProps) => {
  const { state, content } = useGame();
  const { isActive, activate, disable } = useAmbience();
  const hasSave = state.hasStarted;

  return (
    <main className="start-screen" id="main-content">
      <img
        className="start-screen__art"
        src={`${import.meta.env.BASE_URL}assets/cover-art.webp`}
        alt="Ночная береговая радиостанция Север-7 в холодном свете"
      />
      <div className="start-screen__shade" />
      <section className="start-screen__content">
        <div className="start-screen__brand">
          <p className="eyebrow">Кооперативное расследование / 3–6 игроков</p>
          <h1>{content.title}</h1>
          <p className="start-screen__case">Дело о последнем эфире</p>
          <p className="start-screen__subtitle">{content.subtitle}</p>
        </div>
        <div className="start-screen__actions">
          <button className="button button--primary button--hero" onClick={onStart}>
            {hasSave ? 'Продолжить расследование' : 'Начать расследование'}
          </button>
          {hasSave ? (
            <button className="button button--quiet" onClick={onNewGame}>
              Начать заново
            </button>
          ) : null}
          <button
            className="button button--sound"
            onClick={() => (isActive ? disable() : void activate())}
            aria-pressed={isActive}
          >
            <span aria-hidden="true">{isActive ? '◉' : '○'}</span>
            {isActive ? 'Атмосфера включена' : 'Включить атмосферу'}
          </button>
        </div>
        <dl className="start-screen__facts">
          <div>
            <dt>Продолжительность</dt>
            <dd>40–60 минут</dd>
          </div>
          <div>
            <dt>Формат</dt>
            <dd>Один ноутбук, общая версия</dd>
          </div>
          <div>
            <dt>Подключение</dt>
            <dd>Не требуется после загрузки</dd>
          </div>
        </dl>
        <p className="content-note">
          Вымышленная история содержит ненатуралистичное описание преступления. Важные звуковые
          сигналы всегда продублированы визуально.
        </p>
      </section>
    </main>
  );
};

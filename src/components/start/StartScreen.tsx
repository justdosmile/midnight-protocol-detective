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
        src={`${import.meta.env.BASE_URL}assets/house-cover.webp`}
        alt="Старый загородный дом Вереск ночью под сильным дождём"
      />
      <div className="start-screen__shade" />
      <section className="start-screen__content">
        <div className="start-screen__brand">
          <p className="eyebrow">Детективное расследование / 1–6 следователей</p>
          <h1>{content.title}</h1>
          <p className="start-screen__case">Убийство в доме «Вереск»</p>
          <p className="start-screen__subtitle">{content.subtitle}</p>
        </div>
        <div className="start-screen__actions">
          <button
            className="button button--primary button--hero"
            onClick={() => void activate().catch(() => undefined).finally(onStart)}
          >
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
            {isActive ? 'Музыка включена' : 'Включить музыку'}
          </button>
        </div>
        <dl className="start-screen__facts">
          <div>
            <dt>Продолжительность</dt>
            <dd>35–50 минут</dd>
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
          Все герои и события вымышлены. Жестоких сцен нет. Важные звуки всегда показаны и текстом.
        </p>
      </section>
    </main>
  );
};

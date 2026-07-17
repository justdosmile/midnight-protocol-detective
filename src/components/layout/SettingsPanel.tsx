import { useAmbience } from '../../audio/AmbienceProvider';
import { useGame } from '../../state/GameContext';
import { Modal } from '../modals/Modal';

interface SettingsPanelProps {
  onClose: () => void;
  onRequestReset: () => void;
}

export const SettingsPanel = ({ onClose, onRequestReset }: SettingsPanelProps) => {
  const { state, dispatch } = useGame();
  const { isActive, activate, disable } = useAmbience();
  const { settings } = state;

  const setAudioEnabled = () => {
    if (settings.audio.enabled && isActive) {
      disable();
    } else {
      void activate();
    }
  };

  const updateAccessibility = (
    key: keyof typeof settings.accessibility,
    value: boolean,
  ) => {
    dispatch({
      type: 'SET_SETTINGS',
      settings: {
        ...settings,
        accessibility: { ...settings.accessibility, [key]: value },
      },
    });
  };

  return (
    <Modal title="Настройки терминала" eyebrow="Интерфейс" onClose={onClose}>
      <div className="settings-list">
        <section>
          <h3>Звук</h3>
          <div className="setting-row">
            <div>
              <strong>Атмосфера станции</strong>
              <p>Негромкий гул, эфир и интерфейсные сигналы.</p>
            </div>
            <button
              className={`toggle ${settings.audio.enabled && isActive ? 'toggle--on' : ''}`}
              type="button"
              role="switch"
              aria-checked={settings.audio.enabled && isActive}
              onClick={setAudioEnabled}
            >
              <span />
              {settings.audio.enabled && isActive ? 'Включён' : 'Выключен'}
            </button>
          </div>
          <label className="range-setting">
            <span>Громкость: {Math.round(settings.audio.volume * 100)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.audio.volume}
              disabled={!settings.audio.enabled}
              onChange={(event) =>
                dispatch({
                  type: 'SET_SETTINGS',
                  settings: {
                    ...settings,
                    audio: { ...settings.audio, volume: Number(event.target.value) },
                  },
                })
              }
            />
          </label>
        </section>
        <section>
          <h3>Доступность</h3>
          {(
            [
              ['reducedMotion', 'Минимум анимации', 'Отключает декоративные движения.'],
              ['highContrast', 'Повышенный контраст', 'Усиливает границы и яркость текста.'],
              ['largeText', 'Крупный текст', 'Увеличивает основной размер шрифта.'],
            ] as const
          ).map(([key, label, description]) => (
            <label className="setting-row setting-row--check" key={key}>
              <div>
                <strong>{label}</strong>
                <p>{description}</p>
              </div>
              <input
                type="checkbox"
                checked={settings.accessibility[key]}
                onChange={(event) => updateAccessibility(key, event.target.checked)}
              />
            </label>
          ))}
        </section>
        <section className="danger-zone">
          <h3>Прогресс</h3>
          <p>Сброс удалит заметки, найденные материалы и состояние головоломок.</p>
          <button
            className="button button--danger"
            onClick={() => {
              onClose();
              onRequestReset();
            }}
          >
            Сбросить расследование
          </button>
        </section>
      </div>
    </Modal>
  );
};

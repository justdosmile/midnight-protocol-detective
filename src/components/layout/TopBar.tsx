import { useState } from 'react';
import { useAmbience } from '../../audio/AmbienceProvider';
import { useGame } from '../../state/GameContext';
import {
  formatElapsedTime,
  selectInvestigationProgress,
} from '../../state/selectors';

interface TopBarProps {
  onOpenSettings: () => void;
}

export const TopBar = ({ onOpenSettings }: TopBarProps) => {
  const { state, content } = useGame();
  const { isActive, activate, disable } = useAmbience();
  const [fullscreenError, setFullscreenError] = useState(false);
  const progress = selectInvestigationProgress(state, content);

  const toggleFullscreen = async () => {
    setFullscreenError(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError(true);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar__case">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <p className="eyebrow">Дело {content.caseNumber}</p>
          <strong>{content.title}</strong>
        </div>
      </div>
      <div className="topbar__progress" aria-label={`Прогресс расследования ${progress}%`}>
        <div>
          <span>Прогресс</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="topbar__tools">
        <time className="case-timer" aria-label="Время расследования">
          {formatElapsedTime(state.elapsedSeconds)}
        </time>
        <button
          className="icon-button"
          aria-label={isActive ? 'Выключить звук' : 'Включить звук'}
          title={isActive ? 'Выключить звук' : 'Включить звук'}
          onClick={() => (isActive ? disable() : void activate())}
        >
          <span aria-hidden="true">{isActive ? '◕' : '○'}</span>
        </button>
        <button
          className="icon-button"
          aria-label="Полноэкранный режим"
          title="Полноэкранный режим"
          onClick={() => void toggleFullscreen()}
        >
          <span aria-hidden="true">⛶</span>
        </button>
        <button
          className="icon-button"
          aria-label="Открыть настройки"
          title="Настройки"
          onClick={onOpenSettings}
        >
          <span aria-hidden="true">⚙</span>
        </button>
      </div>
      {fullscreenError ? (
        <span className="toast" role="status">
          Полноэкранный режим недоступен в этом окне.
        </span>
      ) : null}
    </header>
  );
};

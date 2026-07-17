import { useEffect, useState } from 'react';
import { FinalAccusation } from './components/FinalAccusation';
import { ChapterWorkspace } from './components/layout/ChapterWorkspace';
import { RightRail } from './components/layout/RightRail';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MaterialViewer } from './components/materials/MaterialViewer';
import { SuspectViewer } from './components/materials/SuspectViewer';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { StartScreen } from './components/start/StartScreen';
import { useGame } from './state/GameContext';
import { selectCanAttemptFinale, selectSelectedMaterial } from './state/selectors';
import type { Suspect } from './types/game';

export default function App() {
  const { state, dispatch, content } = useGame();
  const [enteredTerminal, setEnteredTerminal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const selectedMaterial = selectSelectedMaterial(state, content);
  const canAttemptFinale = selectCanAttemptFinale(state, content);
  const accessibilityClasses = [
    state.settings.accessibility.reducedMotion ? 'reduced-motion' : '',
    state.settings.accessibility.highContrast ? 'high-contrast' : '',
    state.settings.accessibility.largeText ? 'large-text' : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    const classNames = ['reduced-motion', 'high-contrast', 'large-text'];
    for (const className of classNames) {
      const enabled = accessibilityClasses.includes(className);
      document.documentElement.classList.toggle(className, enabled);
      document.body.classList.toggle(className, enabled);
    }
    return () => {
      document.documentElement.classList.remove(...classNames);
      document.body.classList.remove(...classNames);
    };
  }, [accessibilityClasses]);

  const enter = () => {
    dispatch({ type: 'START_GAME', now: Date.now() });
    setEnteredTerminal(true);
  };

  const reset = () => {
    dispatch({ type: 'RESET_GAME' });
    setResetOpen(false);
    setSettingsOpen(false);
    setSelectedSuspect(null);
    setEnteredTerminal(false);
  };

  if (!enteredTerminal) {
    return (
      <div className={accessibilityClasses}>
        <StartScreen onStart={enter} onNewGame={() => setResetOpen(true)} />
        {resetOpen ? (
          <ConfirmModal
            title="Начать новое расследование?"
            message="Текущие заметки и прогресс будут удалены. Настройки экрана и звука сохранятся."
            confirmLabel="Начать заново"
            destructive
            onConfirm={reset}
            onClose={() => setResetOpen(false)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={`app-shell ${accessibilityClasses}`}>
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <div className="terminal-layout">
        <Sidebar onSelectSuspect={setSelectedSuspect} />
        <main className="main-panel" id="main-content">
          <ChapterWorkspace />
          {canAttemptFinale ? <FinalAccusation onRestart={reset} /> : null}
        </main>
        <RightRail />
      </div>

      {selectedMaterial ? <MaterialViewer material={selectedMaterial} /> : null}
      {selectedSuspect ? (
        <SuspectViewer suspect={selectedSuspect} onClose={() => setSelectedSuspect(null)} />
      ) : null}
      {settingsOpen ? (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          onRequestReset={() => setResetOpen(true)}
        />
      ) : null}
      {resetOpen ? (
        <ConfirmModal
          title="Сбросить расследование?"
          message="Будут удалены просмотренные материалы, решения задач, заметки и время прохождения."
          confirmLabel="Сбросить прогресс"
          destructive
          onConfirm={reset}
          onClose={() => setResetOpen(false)}
        />
      ) : null}
    </div>
  );
}

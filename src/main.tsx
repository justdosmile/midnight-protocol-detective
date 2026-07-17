import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AmbienceProvider } from './audio/AmbienceProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameProvider } from './state/GameContext';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/puzzles.css';
import './styles/responsive.css';

const root = document.getElementById('root');
if (!root) throw new Error('Корневой элемент приложения не найден.');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <GameProvider>
        <AmbienceProvider>
          <App />
        </AmbienceProvider>
      </GameProvider>
    </ErrorBoundary>
  </StrictMode>,
);

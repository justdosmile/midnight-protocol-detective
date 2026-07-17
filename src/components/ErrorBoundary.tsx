import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, details: ErrorInfo): void {
    console.error('Неожиданная ошибка интерфейса расследования', error, details.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="fatal-screen" id="main-content">
          <div className="fatal-screen__panel">
            <p className="eyebrow">СИСТЕМА ВОССТАНОВЛЕНИЯ</p>
            <h1>Терминал временно потерял связь с материалами</h1>
            <p>
              Прогресс хранится в браузере. Перезагрузите страницу — сохранённое расследование
              продолжится с последнего устойчивого состояния.
            </p>
            <button className="button button--primary" onClick={() => window.location.reload()}>
              Перезагрузить терминал
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

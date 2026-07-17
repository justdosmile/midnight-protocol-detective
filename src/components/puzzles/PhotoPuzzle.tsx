import { useState } from 'react';
import type { PhotoPuzzleInteraction, PuzzleDefinition } from '../../types/game';

interface PhotoPuzzleProps {
  puzzle: PuzzleDefinition;
  interaction: PhotoPuzzleInteraction;
  onSolved: (value: unknown) => void;
}

export const PhotoPuzzle = ({ interaction, onSolved }: PhotoPuzzleProps) => {
  const [zoom, setZoom] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [exposure, setExposure] = useState(1);
  const [message, setMessage] = useState('');
  const targetAvailable =
    zoom >= interaction.minimumZoom &&
    contrast >= interaction.minimumContrast &&
    exposure >= interaction.minimumExposure;
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Number(value.toFixed(2))));

  const inspectTarget = () => {
    if (targetAvailable) {
      onSolved({ zoom, contrast, exposure, target: interaction.targetLabel });
    } else {
      setMessage('Маркировка ещё сливается с поверхностью. Настройте масштаб, контраст и экспозицию.');
    }
  };

  return (
    <div className="photo-puzzle">
      <div className="photo-controls">
        <div className="photo-control">
          <label htmlFor="photo-zoom">Увеличение {Math.round(zoom * 100)}%</label>
          <div className="range-with-buttons">
            <button type="button" className="icon-button" aria-label="Уменьшить масштаб" onClick={() => setZoom((value) => clamp(value - 0.05, 1, 2.2))}>−</button>
          <input
            id="photo-zoom"
            type="range"
            min="1"
            max="2.2"
            step="0.05"
            value={zoom}
            onChange={(event) => {
              setZoom(Number(event.target.value));
              setMessage('');
            }}
          />
            <button type="button" className="icon-button" aria-label="Увеличить масштаб" onClick={() => { setZoom((value) => clamp(value + 0.05, 1, 2.2)); setMessage(''); }}>+</button>
          </div>
        </div>
        <div className="photo-control">
          <label htmlFor="photo-contrast">Контраст {Math.round(contrast * 100)}%</label>
          <div className="range-with-buttons">
            <button type="button" className="icon-button" aria-label="Понизить контраст" onClick={() => setContrast((value) => clamp(value - 0.05, 0.8, 1.8))}>−</button>
          <input
            id="photo-contrast"
            type="range"
            min="0.8"
            max="1.8"
            step="0.05"
            value={contrast}
            onChange={(event) => {
              setContrast(Number(event.target.value));
              setMessage('');
            }}
          />
            <button type="button" className="icon-button" aria-label="Повысить контраст" onClick={() => { setContrast((value) => clamp(value + 0.05, 0.8, 1.8)); setMessage(''); }}>+</button>
          </div>
        </div>
        <div className="photo-control">
          <label htmlFor="photo-exposure">Экспозиция {Math.round(exposure * 100)}%</label>
          <div className="range-with-buttons">
            <button type="button" className="icon-button" aria-label="Понизить экспозицию" onClick={() => setExposure((value) => clamp(value - 0.05, 0.7, 1.5))}>−</button>
          <input
            id="photo-exposure"
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={exposure}
            onChange={(event) => { setExposure(Number(event.target.value)); setMessage(''); }}
          />
            <button type="button" className="icon-button" aria-label="Повысить экспозицию" onClick={() => { setExposure((value) => clamp(value + 0.05, 0.7, 1.5)); setMessage(''); }}>+</button>
          </div>
        </div>
      </div>
      <div className="inspection-viewport">
        <div
          className="inspection-image"
          style={{
            transform: `scale(${zoom})`,
            filter: `contrast(${contrast}) brightness(${exposure})`,
          }}
        >
          <img src={interaction.image} alt={interaction.imageAlt} />
          <button
            className={`inspection-target ${targetAvailable ? 'inspection-target--visible' : ''}`}
            style={{
              left: `${interaction.target.x}%`,
              top: `${interaction.target.y}%`,
              width: `${interaction.target.width}%`,
              height: `${interaction.target.height}%`,
            }}
            onClick={inspectTarget}
            aria-label={targetAvailable ? `Проверить область: ${interaction.targetLabel}` : 'Исследовать область монтажного стола'}
          >
            <span>{targetAvailable ? interaction.targetLabel : 'Исследовать'}</span>
          </button>
        </div>
      </div>
      <p className="input-help">Значимая деталь крупная и доступна с клавиатуры через кнопку на снимке.</p>
      {targetAvailable ? (
        <p className="puzzle-message" role="status">
          Контуры читаются лучше. Проверьте служебную область на снимке.
        </p>
      ) : null}
      {message ? <p className="puzzle-message puzzle-message--wrong" role="status">{message}</p> : null}
    </div>
  );
};

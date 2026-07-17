import { useState } from 'react';
import { useAmbience } from '../../audio/AmbienceProvider';
import { useGame } from '../../state/GameContext';
import type { Material } from '../../types/game';
import { Modal } from '../modals/Modal';

const kindLabels: Record<Material['kind'], string> = {
  briefing: 'сводка',
  profile: 'досье',
  document: 'документ',
  image: 'фотография',
  camera: 'наблюдение',
  audio: 'запись',
  map: 'схема',
  log: 'список событий',
  message: 'показания',
};

interface MaterialViewerProps {
  material: Material;
}

export const MaterialViewer = ({ material }: MaterialViewerProps) => {
  const { state, dispatch } = useGame();
  const { playUiSound } = useAmbience();
  const [zoom, setZoom] = useState(1);
  const starred = state.starredEvidenceIds.includes(material.id);

  return (
    <Modal
      title={material.title}
      eyebrow={material.eyebrow}
      size="wide"
      onClose={() => dispatch({ type: 'CLOSE_MATERIAL' })}
      footer={
        <button
          className={`button ${starred ? 'button--active' : 'button--quiet'}`}
          onClick={() => dispatch({ type: 'TOGGLE_STAR', materialId: material.id })}
          aria-pressed={starred}
        >
          <span aria-hidden="true">{starred ? '★' : '☆'}</span>{' '}
          {starred ? 'Отмечено как важное' : 'Отметить как важное'}
        </button>
      }
    >
      <article className="document-viewer">
        <div className="document-viewer__meta">
          <span>{kindLabels[material.kind]}</span>
          {material.timeLabels.map((time) => (
            <span key={time}>{time}</span>
          ))}
          {material.isRequired ? <span>обязательно</span> : null}
        </div>
        <p className="document-viewer__lead">{material.summary}</p>
        {material.image ? (
          <figure className="document-viewer__figure">
            <div className="zoom-controls" aria-label="Масштаб документа">
              <button
                className="icon-button"
                onClick={() => setZoom((value) => Math.max(0.8, value - 0.2))}
                aria-label="Уменьшить"
              >
                −
              </button>
              <output>{Math.round(zoom * 100)}%</output>
              <button
                className="icon-button"
                onClick={() => setZoom((value) => Math.min(2.4, value + 0.2))}
                aria-label="Увеличить"
              >
                +
              </button>
            </div>
            <div
              className="document-viewer__image-stage"
              role="region"
              tabIndex={0}
              aria-label={`Увеличенное изображение: ${material.imageAlt ?? material.title}`}
            >
              <img
                src={material.image}
                alt={material.imageAlt ?? ''}
                style={{ transform: `scale(${zoom})` }}
                onLoad={() => playUiSound('open')}
              />
            </div>
          </figure>
        ) : null}
        <div className="document-viewer__sections">
          {material.sections.map((section, index) => (
            <section key={`${material.id}-${index}`}>
              {section.heading ? <h3>{section.heading}</h3> : null}
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </Modal>
  );
};

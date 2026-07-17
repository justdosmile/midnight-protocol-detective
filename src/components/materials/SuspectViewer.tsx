import type { Suspect } from '../../types/game';
import { Modal } from '../modals/Modal';

interface SuspectViewerProps {
  suspect: Suspect;
  onClose: () => void;
}

export const SuspectViewer = ({ suspect, onClose }: SuspectViewerProps) => (
  <Modal title={suspect.name} eyebrow="Карточка участника" size="regular" onClose={onClose}>
    <article className="suspect-profile">
      <img src={suspect.portrait} alt={suspect.portraitAlt} />
      <div>
        <p className="suspect-profile__role">{suspect.role}</p>
        <p>{suspect.summary}</p>
        <blockquote>{suspect.statement}</blockquote>
        <ul className="tag-list" aria-label="Связанные темы">
          {suspect.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </article>
  </Modal>
);

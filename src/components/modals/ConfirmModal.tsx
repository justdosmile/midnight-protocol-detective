import { Modal } from './Modal';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  destructive?: boolean;
}

export const ConfirmModal = ({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  destructive = false,
}: ConfirmModalProps) => (
  <Modal
    title={title}
    eyebrow="Подтверждение"
    size="compact"
    onClose={onClose}
    footer={
      <>
        <button className="button button--quiet" onClick={onClose}>
          Отмена
        </button>
        <button
          className={`button ${destructive ? 'button--danger' : 'button--primary'}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </>
    }
  >
    <p>{message}</p>
  </Modal>
);

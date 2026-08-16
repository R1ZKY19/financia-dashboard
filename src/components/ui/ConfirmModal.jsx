import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ open, onClose, onConfirm, title = 'Konfirmasi', message, confirmLabel = 'Hapus', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-expense/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-expense" />
        </div>
        <p className="text-sm text-ink dark:text-gray-200">{message}</p>
      </div>
    </Modal>
  );
}

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4 text-xs">
        <div className="flex items-start space-x-3 p-3 bg-ops-bg border border-ops-border rounded-lg">
          <div className={`p-2 rounded-md shrink-0 border ${isDangerous ? 'bg-rose-950/60 text-rose-400 border-rose-800/50 shadow-glow-rose' : 'bg-amber-950/60 text-amber-400 border-amber-800/50 shadow-glow-amber'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-ops-muted text-xs leading-relaxed font-sans">{message}</p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-ops-panel hover:bg-ops-panelHover border border-ops-border text-ops-muted hover:text-ops-text rounded-md font-mono text-xs font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 font-mono text-xs font-bold rounded-md shadow-2xs uppercase tracking-wider transition-all disabled:opacity-50 ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-glow-rose'
                : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-glow-cyan'
            }`}
          >
            {isLoading ? 'EXECUTING...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

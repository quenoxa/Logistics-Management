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
      <div className="space-y-4 text-sm font-sans">
        <div className="flex items-start space-x-3 p-3.5 bg-[#0B1220] border border-[#263852] rounded-xl">
          <div
            className={`p-2 rounded-lg shrink-0 border ${
              isDangerous
                ? 'bg-[#3B2028] text-[#E26D7A] border-[#E26D7A]/40'
                : 'bg-[#3B2D17] text-[#E5A93D] border-[#E5A93D]/40'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-[#A9B7C9] text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#263852]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-[#0B1220] hover:bg-[#18263B] border border-[#344A66] text-[#F8FAFC] rounded-lg text-sm font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 ${
              isDangerous
                ? 'bg-[#3B2028] hover:bg-[#4E2B35] text-[#E26D7A] border border-[#E26D7A]/40'
                : 'bg-[#D4A84F] hover:bg-[#E5BC68] text-[#0B1220]'
            }`}
          >
            {isLoading ? 'Executing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

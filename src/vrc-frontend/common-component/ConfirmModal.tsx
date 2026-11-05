import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { Modal } from './Modal.tsx';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = true,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { language } = useLanguage();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidthClass="max-w-sm"
      icon={
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isDanger ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
        </div>
      }
      title={title}
    >
      <div className="p-6 space-y-4">
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{message}</p>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            {cancelText || (language === 'vi' ? 'Hủy' : 'Cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-stone-900 hover:bg-stone-800'
            }`}
          >
            {loading
              ? language === 'vi'
                ? 'Đang xử lý...'
                : 'Processing...'
              : confirmText || (language === 'vi' ? 'Xác Nhận' : 'Confirm')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

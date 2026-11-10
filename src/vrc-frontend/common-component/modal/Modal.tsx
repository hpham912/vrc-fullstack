import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { modalStyles as s } from './Modal.styles.ts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidthClass = 'max-w-md',
  children,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;
  if (typeof document === 'undefined') return null;

  // Portaled to document.body: a modal rendered inside another modal
  // (e.g. ConfirmModal inside the AdminPortal) would otherwise be
  // trapped by the parent dialog's scale/translate animation classes,
  // which make it a containing block for fixed-position descendants —
  // the nested modal then centers inside the parent instead of the
  // viewport and gets clipped. Same pattern as NotificationModal.
  return createPortal(
    <div
      className={`${s.backdropBase} ${isVisible ? s.backdropVisible : s.backdropHidden}`}
      onClick={(e) => {
        // Stop the tap here: this modal is portaled to document.body,
        // but in React's tree it is still a child of whatever opened
        // it — so without this, a backdrop tap bubbles up to that
        // parent's click handler. On an event card that re-opens the
        // event details right after the popup closes (the tap that
        // dismisses this popup also opens the card underneath).
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className={`${s.dialogBase} ${maxWidthClass} ${
          isVisible ? s.dialogVisible : s.dialogHidden
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle || icon) && (
          <div className={s.header}>
            <div className={s.headerLeft}>
              {icon && <div className={s.iconWrap}>{icon}</div>}
              <div className={s.titleGroup}>
                {subtitle && <span className={s.subtitle}>{subtitle}</span>}
                {title && <h3 className={s.title}>{title}</h3>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={s.closeBtn}
              aria-label="Close"
            >
              <X className={s.closeIcon} />
            </button>
          </div>
        )}

        <div className={s.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

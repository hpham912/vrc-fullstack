import { useEffect } from 'react';

// Locks the background page scroll while a modal is open, so scrolling
// inside the modal never moves the screen behind it. The lock lives on
// document.body + document.documentElement (overflow hidden) and is
// reference-counted: several modals can be open at once (e.g. a
// ConfirmModal inside the AdminPortal) and the background stays locked
// until the LAST one closes. The previous overflow values are restored
// when the count reaches zero.
let lockCount = 0;
let prevBodyOverflow = '';
let prevHtmlOverflow = '';

export const useBodyScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      prevBodyOverflow = document.body.style.overflow;
      prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      }
    };
  }, [active]);
};

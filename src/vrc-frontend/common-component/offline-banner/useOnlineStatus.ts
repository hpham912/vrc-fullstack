import { useEffect, useState } from 'react';

// Whether the device reports a network connection, live: true on
// load when navigator says online, then follows the browser's
// online/offline events. One caveat — navigator.onLine only reports
// the device's link state, so a dead server or a captive portal
// still reads online. That is why the load-error view exists next
// to the banner: the banner catches "no connection", the error view
// catches "the load itself failed".
export const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    // No navigator (tests, SSR) means no signal — assume online.
    // In a real browser onLine is always a boolean.
    typeof navigator === 'undefined' ? true : navigator.onLine ?? true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

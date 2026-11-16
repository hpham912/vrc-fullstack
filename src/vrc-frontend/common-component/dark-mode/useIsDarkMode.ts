import { useEffect, useState } from 'react';

// True when the app is in dark mode (the .dark class on <html>).
// Listens for class changes so the caller re-renders when the OS
// theme flips mid-session. Inline styles cannot use Tailwind's dark:
// variant, so a custom banner theme reads this to pick its darker
// colors.
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

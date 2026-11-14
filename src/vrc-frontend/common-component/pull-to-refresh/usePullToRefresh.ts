import { useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 70; // px the user must pull down to trigger a refresh
const MAX_PULL = 120; // px the indicator follows the finger (capped)

// Pull-to-refresh for the app's scrollable pages. The user drags down
// from the very top of the page; past the threshold, releasing triggers
// onRefresh. Returns the pull distance (for the indicator) and whether
// a refresh is running.
// Only engages when the page is already at the very top and the user
// drags down — normal scrolling is untouched. While pulling, the
// browser's own overscroll bounce is suppressed so the indicator is
// the feedback.
export const usePullToRefresh = (onRefresh: () => Promise<void> | void) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || refreshingRef.current) return;
      if (window.scrollY > 0) {
        startYRef.current = null;
        pullRef.current = 0;
        setPullDistance(0);
        return;
      }
      const deltaY = e.touches[0].clientY - startYRef.current;
      if (deltaY > 0) {
        // Pulling down at the top — track it and stop the browser's
        // own overscroll bounce so our indicator is the feedback.
        e.preventDefault();
        const distance = Math.min(deltaY * 0.5, MAX_PULL);
        pullRef.current = distance;
        setPullDistance(distance);
      } else {
        startYRef.current = null;
        pullRef.current = 0;
        setPullDistance(0);
      }
    };

    const onTouchEnd = () => {
      if (startYRef.current === null) return;
      const distance = pullRef.current;
      startYRef.current = null;
      if (distance >= PULL_THRESHOLD && !refreshingRef.current) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);
        Promise.resolve()
          .then(() => onRefreshRef.current())
          .catch(() => {})
          .finally(() => {
            refreshingRef.current = false;
            setIsRefreshing(false);
            setPullDistance(0);
            pullRef.current = 0;
          });
      } else {
        pullRef.current = 0;
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return { pullDistance, isRefreshing };
};

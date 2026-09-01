import { useEffect, useRef, useCallback } from 'react';

interface AutoRefreshOptions {
  /**
   * Polling interval in milliseconds.
   * Defaults to 15000 (15 seconds). Set to 0 to disable periodic polling.
   */
  intervalMs?: number;
  /**
   * Whether automatic synchronization is enabled. Defaults to true.
   */
  enabled?: boolean;
  /**
   * Whether polling should pause when the browser tab is hidden/minimized.
   * Defaults to true (saves battery & network traffic).
   */
  pauseWhenHidden?: boolean;
  /**
   * Whether to immediately trigger a fresh refetch when the user focuses or returns to the tab.
   * Defaults to true.
   */
  refetchOnWindowFocus?: boolean;
}

/**
 * Reusable, visibility-aware data synchronization hook for LOGISTICS ONE.
 * 
 * Architectural rules:
 * - Polls only when the tab is visible.
 * - Pauses polling when the tab is hidden.
 * - Immediately triggers a background refresh when returning to the tab.
 * - Provides an `execute` handle to manually trigger immediate refetches.
 */
export function useAutoRefresh(
  fetchFn: (showLoading: boolean) => Promise<void> | void,
  options: AutoRefreshOptions = {}
) {
  const {
    intervalMs = 15000,
    enabled = true,
    pauseWhenHidden = true,
    refetchOnWindowFocus = true,
  } = options;

  const savedCallback = useRef(fetchFn);
  const sequenceRef = useRef(0);

  // Keep callback ref updated
  useEffect(() => {
    savedCallback.current = fetchFn;
  }, [fetchFn]);

  const execute = useCallback(async (showLoading = false) => {
    sequenceRef.current += 1;
    try {
      await savedCallback.current(showLoading);
    } catch (err) {
      // Handled inside page fetch logic
    }
  }, []);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (pauseWhenHidden && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }
        execute(false);
      }, intervalMs);
    };

    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        if (refetchOnWindowFocus) {
          execute(false);
        }
        startTimer();
      } else {
        if (pauseWhenHidden && timer) {
          clearInterval(timer);
          timer = null;
        }
      }
    };

    startTimer();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [intervalMs, enabled, pauseWhenHidden, refetchOnWindowFocus, execute]);

  return { refresh: execute };
}

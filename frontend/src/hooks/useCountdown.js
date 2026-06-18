import { useState, useEffect, useRef } from 'react';

/**
 * useCountdown(targetDate)
 * Returns { minutes, seconds, timeLeftMs, isExpired, progress }
 * where progress (0→1) is how much of the ORIGINAL duration has elapsed.
 */
export default function useCountdown(targetDate, totalDurationMs = 10 * 60 * 1000) {
  const [timeLeftMs, setTimeLeftMs] = useState(() =>
    targetDate ? Math.max(0, new Date(targetDate) - Date.now()) : 0
  );
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeftMs(0);
      return;
    }

    function tick() {
      const remaining = Math.max(0, new Date(targetDate) - Date.now());
      setTimeLeftMs(remaining);
      if (remaining === 0) clearInterval(intervalRef.current);
    }

    tick(); // run immediately
    intervalRef.current = setInterval(tick, 500);

    return () => clearInterval(intervalRef.current);
  }, [targetDate]);

  const minutes  = Math.floor(timeLeftMs / 60_000);
  const seconds  = Math.floor((timeLeftMs % 60_000) / 1000);
  const isExpired = timeLeftMs === 0;
  const progress  = totalDurationMs > 0
    ? Math.max(0, Math.min(1, timeLeftMs / totalDurationMs))
    : 0;

  return { minutes, seconds, timeLeftMs, isExpired, progress };
}

import { useState, useEffect } from "react";

/**
 * Debounce hook - delays updating the value until after the specified delay
 * Useful for search inputs to prevent API calls on every keystroke
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook - limits how often a value can update
 * Useful for scroll handlers or real-time updates
 *
 * @param {any} value - The value to throttle
 * @param {number} limit - Minimum time between updates in milliseconds
 * @returns {any} Throttled value
 */
export function useThrottle(value, limit) {
  const [throttledValue, setThrottledValue] = useState(value);
  const [lastRan, setLastRan] = useState(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan >= limit) {
          setThrottledValue(value);
          setLastRan(Date.now());
        }
      },
      limit - (Date.now() - lastRan),
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit, lastRan]);

  return throttledValue;
}

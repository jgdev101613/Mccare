import { useState, useEffect } from "react";

/**
 * useDebounce
 * Returns a debounced version of the input value that only updates
 * after the specified delay.
 *
 * @param {any} value - The value you want to debounce (string, number, object).
 * @param {number} delay - Delay in ms (default: 300).
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup the timer if value or delay changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

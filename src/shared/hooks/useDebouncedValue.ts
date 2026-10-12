import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value`.
 * Updates `debouncedValue` only after `delayMs` has passed
 * without a new `value` arriving.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
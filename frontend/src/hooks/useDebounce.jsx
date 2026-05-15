import { useState, useEffect } from "react";
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Cleanup function cancels the timeout if useEffect is called again before the timeout
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}
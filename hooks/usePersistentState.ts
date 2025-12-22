import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function usePersistentState<T>(key: string, initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialState;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : initialState;
    } catch (err) {
      console.warn('usePersistentState parse error', err);
      return initialState;
    }
  });

  useEffect(() => {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn('usePersistentState save error', err);
    }
  }, [key, state]);

  return [state, setState];
}

export default usePersistentState;

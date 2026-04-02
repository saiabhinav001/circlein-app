'use client';

import { useCallback, useEffect, useState } from 'react';

const SIMPLE_MODE_STORAGE_KEY = 'circlein-simple-mode';
const SIMPLE_MODE_EVENT = 'circlein-simple-mode-change';

function parseStoredSimpleMode(rawValue: string | null, defaultValue: boolean): boolean {
  if (rawValue == null) {
    return defaultValue;
  }

  return rawValue === 'true';
}

export function useSimpleMode(defaultValue = true) {
  const [simpleMode, setSimpleModeState] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const initialValue = parseStoredSimpleMode(
      window.localStorage.getItem(SIMPLE_MODE_STORAGE_KEY),
      defaultValue
    );

    window.localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, String(initialValue));
    setSimpleModeState(initialValue);
    setReady(true);
  }, [defaultValue]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SIMPLE_MODE_STORAGE_KEY) {
        return;
      }

      setSimpleModeState(parseStoredSimpleMode(event.newValue, defaultValue));
    };

    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ value?: boolean }>;
      if (typeof customEvent.detail?.value === 'boolean') {
        setSimpleModeState(customEvent.detail.value);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SIMPLE_MODE_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SIMPLE_MODE_EVENT, handleCustomEvent as EventListener);
    };
  }, [defaultValue]);

  const setSimpleMode = useCallback((value: boolean) => {
    setSimpleModeState(value);

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, String(value));
    window.dispatchEvent(new CustomEvent(SIMPLE_MODE_EVENT, { detail: { value } }));
  }, []);

  const toggleSimpleMode = useCallback(() => {
    setSimpleMode(!simpleMode);
  }, [setSimpleMode, simpleMode]);

  return {
    simpleMode,
    setSimpleMode,
    toggleSimpleMode,
    ready,
  };
}

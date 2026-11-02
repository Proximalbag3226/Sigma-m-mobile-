import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSettings, persistSettings, Settings } from './storage';

interface SettingsContextValue {
  settings: Settings;
  loaded: boolean;
  configured: boolean;
  save: (next: Settings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

//sI vas a usar esto en produccion cambia el APIKey
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({ baseUrl: 'http://127.0.0.1:8000/', apiKey: 'Clave_asi_super_secreta_cambiar_en_producción' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback(async (next: Settings) => {
    const clean = { baseUrl: next.baseUrl.trim().replace(/\/+$/, ''), apiKey: next.apiKey.trim() };
    await persistSettings(clean);
    setSettings(clean);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, loaded, configured: !!settings.baseUrl && !!settings.apiKey, save }),
    [settings, loaded, save],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return ctx;
}

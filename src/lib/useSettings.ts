'use client';

import { useState, useEffect, useCallback } from 'react';
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from './types';

export function useSettings() {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const saveSettings = useCallback(async (data: Partial<CompanySettings>) => {
    const updated = { ...settings, ...data };
    setSettings(updated);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    return updated;
  }, [settings]);

  return { settings, saveSettings, loaded };
}

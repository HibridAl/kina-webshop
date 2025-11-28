'use client';

import { useEffect, useState } from 'react';

export type Locale = 'hu' | 'en';

function getCurrentLocale(): Locale {
  if (typeof document === 'undefined') return 'hu';
  const value = document.documentElement.getAttribute('data-locale');
  return value === 'en' ? 'en' : 'hu';
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(getCurrentLocale);

  useEffect(() => {
    const handler = (event: Event) => {
      if (event instanceof CustomEvent && (event.detail?.locale === 'hu' || event.detail?.locale === 'en')) {
        setLocale(event.detail.locale);
      } else {
        setLocale(getCurrentLocale());
      }
    };

    window.addEventListener('autohub:locale-change', handler);
    return () => {
      window.removeEventListener('autohub:locale-change', handler);
    };
  }, []);

  return { locale };
}

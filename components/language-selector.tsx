'use client';

import { useEffect, useState } from 'react';

type Locale = 'hu' | 'en';

const OPTIONS: Array<{ code: Locale; label: string; flag: string }> = [
  { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const STORAGE_KEY = 'autohub-locale';

export function LanguageSelector() {
  const [locale, setLocale] = useState<Locale>('hu');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === 'en' || stored === 'hu') {
        setLocale(stored);
        applyLocale(stored);
      } else {
        applyLocale('hu');
      }
    } catch (error) {
      applyLocale('hu');
    }
  }, []);

  useEffect(() => {
    applyLocale(locale);
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch (error) {
      // ignore write errors
    }
  }, [locale]);

  function applyLocale(next: Locale) {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-locale', next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent('autohub:locale-change', { detail: { locale: next } }));
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-1 text-xs shadow-sm">
      {OPTIONS.map((option) => {
        const active = option.code === locale;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => setLocale(option.code)}
            className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
              active ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={active}
          >
            <span aria-hidden>{option.flag}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

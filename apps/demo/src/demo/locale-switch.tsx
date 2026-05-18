import type { Locale } from '../lib/i18n';
import { cn } from '@react33/react-styles';

const locales = ['es', 'en'] as const satisfies readonly Locale[];

export function LocaleSwitch({
  currentLocale,
  setLocale,
}: {
  currentLocale: Locale;
  setLocale: (locale: Locale) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-space-sm">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            'inline-flex items-center rounded-full border px-space-md py-space-sm text-sm font-medium transition-colors',
            currentLocale === code
              ? 'border-accent-100 bg-accent-100 text-neutral-050'
              : 'border-border-200 bg-bg-100 text-text-200 hover:border-border-100 hover:bg-bg-300',
          )}
          aria-pressed={currentLocale === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

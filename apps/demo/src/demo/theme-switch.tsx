import { cn } from '@maurotaliente/react-styles';

export type DemoTheme = 'light' | 'dark';

export function ThemeSwitch({
  currentTheme,
  setTheme,
}: {
  currentTheme: DemoTheme;
  setTheme: (theme: DemoTheme) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-space-sm">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'inline-flex items-center gap-space-xs rounded-full border px-space-md py-space-sm text-sm font-medium transition-colors',
          currentTheme === 'light'
            ? 'border-accent-100 bg-accent-100 text-neutral-050'
            : 'border-border-200 bg-bg-100 text-text-200 hover:border-border-100 hover:bg-bg-300',
        )}
        aria-pressed={currentTheme === 'light'}
      >
        <span aria-hidden>☀</span>
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'inline-flex items-center gap-space-xs rounded-full border px-space-md py-space-sm text-sm font-medium transition-colors',
          currentTheme === 'dark'
            ? 'border-accent-100 bg-accent-100 text-neutral-050'
            : 'border-border-200 bg-bg-100 text-text-200 hover:border-border-100 hover:bg-bg-300',
        )}
        aria-pressed={currentTheme === 'dark'}
      >
        <span aria-hidden>◐</span>
        Dark
      </button>
    </div>
  );
}

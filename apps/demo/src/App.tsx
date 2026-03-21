import { cn, buildStyles, useBuildStyles } from '@lib/styles';
import { useTheme } from './theme/runtime';
import { apis } from './api/apis.generated';
import { PokemonDemo } from './PokemonDemo';

/** Mismo tipo que `export const apis` en `apis.generated.ts` — `keyof` = nombres de API del config. */
export type DemoAppApis = typeof apis;

/* buildStyles: define estilos reutilizables con tokens del @theme */
const cardStyles = buildStyles({
  base: [
    'rounded-card',
    'border border-border-100 border-(length:--border-card)',
    'bg-bg-200 shadow-card',
    'p-space-lg transition-all duration-normal',
    'text-text-100',
  ],
  hover: 'hover:bg-bg-300 hover:shadow-dropdown',
});

const buttonStyles = buildStyles({
  primary: [
    'rounded-button',
    'border-(length:--border-card) border-accent-100',
    'bg-accent-100 text-white shadow-button',
    'px-space-lg py-space-md font-medium',
    'transition-all duration-fast hover:opacity-90 active:scale-[0.98]',
  ],
  secondary: [
    'rounded-button',
    'border border-border-100 border-(length:--border-card)',
    'bg-bg-200 text-text-100',
    'px-space-lg py-space-md font-medium',
    'transition-all duration-fast hover:bg-bg-300',
  ],
});

const badgeStyles = buildStyles({
  base: [
    'rounded-badge',
    'bg-bg-300 text-text-200',
    'px-space-sm py-space-xs text-xs font-medium',
  ],
});

export default function App() {
  const [currentTheme, setTheme] = useTheme();
  const styles = useBuildStyles(cardStyles);
  const btnStyles = useBuildStyles(buttonStyles);
  const badge = useBuildStyles(badgeStyles);

  return (
    <div className="min-h-screen bg-bg-100 font-sans">
      <div className="max-w-screen-lg mx-auto p-space-xl space-y-space-2xl">
        {/* Hero */}
        <header className="flex flex-wrap items-start justify-between gap-space-lg">
          <div>
            <h1
              className="text-(length:--text-2xl) font-bold leading-tight text-text-100"
            >
              Design System Demo
            </h1>
            <p className="text-text-200 mt-space-sm text-(length:--text-md)">
              Misma estructura de tokens, distintos valores por producto. Botones, cards y más usan{' '}
              <code className="bg-bg-300 px-space-xs rounded-input">
                radius.button
              </code>
              ,{' '}
              <code className="bg-bg-300 px-space-xs rounded-input">
                shadow.card
              </code>
              , etc.
            </p>
          </div>
          <div className="flex gap-space-xs shrink-0">
            <button
              type="button"
              onClick={() => setTheme('light')}
              title="Light"
              className={cn(
                'rounded-full p-2 transition-colors duration-fast',
                currentTheme === 'light'
                  ? 'bg-bg-200 text-accent-100 ring-2 ring-accent-100'
                  : 'text-text-300 hover:bg-bg-200',
              )}
              aria-pressed={currentTheme === 'light'}
            >
              <span className="sr-only">Light</span>
              <span aria-hidden>☀</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              title="Dark"
              className={cn(
                'rounded-full p-2 transition-colors duration-fast',
                currentTheme === 'dark'
                  ? 'bg-bg-200 text-accent-100 ring-2 ring-accent-100'
                  : 'text-text-300 hover:bg-bg-200',
              )}
              aria-pressed={currentTheme === 'dark'}
            >
              <span className="sr-only">Dark</span>
              <span aria-hidden>🌙</span>
            </button>
          </div>
        </header>

        {/* Stats row con bordes */}
        <section
          className={cn(
            'flex flex-wrap gap-space-lg p-space-lg',
            'bg-bg-200 rounded-card',
            'border border-border-100',
            'shadow-card',
          )}
        >
          <div className="flex-1 min-w-[120px] p-space-md rounded-md">
            <div className="text-2xl font-bold text-accent-100">80%</div>
            <div className="text-sm text-text-300">Convención compartida</div>
          </div>
          <div
            className={cn(
              'flex-1 min-w-[120px] pl-space-lg p-space-md rounded-md',
              'border-l border-border-200 border-(length:--border-row)',
            )}
          >
            <div className="text-2xl font-bold text-text-100">100%</div>
            <div className="text-sm text-text-300">Tokens configurables</div>
          </div>
          <div
            className={cn(
              'flex-1 min-w-[120px] pl-space-lg p-space-md rounded-md',
              'border-l border-border-200 border-(length:--border-row)',
            )}
          >
            <div className="text-2xl font-bold text-text-100">∞</div>
            <div className="text-sm text-text-300">Productos posibles</div>
          </div>
        </section>

        {/* Cards grid */}
        <section>
          <h2
            className="text-(length:--text-xl) font-semibold text-text-100 mb-space-lg"
          >
            Cards con component aliases
          </h2>
          <div className="grid gap-space-lg sm:grid-cols-2">
            <article className={cn(cardStyles.base, cardStyles.hover)}>
              <div className="flex items-center justify-between mb-space-md">
                <h3 className="text-lg font-semibold text-accent-100">buildStyles</h3>
                <span className={badge.base}>API</span>
              </div>
              <p className="text-text-200 text-sm">
                Define objetos de estilos con tokens semánticos. Los componentes consumen{' '}
                <code className="bg-bg-300">radius.card</code>,{' '}
                <code className="bg-bg-300">shadow.card</code> — mismos nombres, distintos
                valores por marca.
              </p>
            </article>
            <article className={cn(styles.base, 'hover:shadow-dropdown')}>
              <div className="flex items-center justify-between mb-space-md">
                <h3 className="text-lg font-semibold text-accent-100">useBuildStyles</h3>
                <span className={badge.base}>Hook</span>
              </div>
              <p className="text-text-200 text-sm">
                Mismo patrón vía hook cuando las clases dependen de estado o props. Ideal para
                variantes dinámicas y componentes condicionales.
              </p>
            </article>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2
            className="text-(length:--text-xl) font-semibold text-text-100 mb-space-lg"
          >
            Botones
          </h2>
          <div className="flex flex-wrap gap-space-lg">
            <button type="button" className={btnStyles.primary}>
              Primary
            </button>
            <button type="button" className={btnStyles.secondary}>
              Secondary
            </button>
            <button
              type="button"
              className={cn(btnStyles.secondary, 'rounded-pill px-space-lg')}
            >
              Pill shape
            </button>
          </div>
        </section>

        <PokemonDemo />

        {/* Row con borde - listado */}
        <section
          className={cn(
            'bg-bg-200 rounded-card shadow-card',
            'overflow-hidden',
          )}
        >
          <h2
            className="text-(length:--text-xl) font-semibold text-text-100 p-space-lg"
          >
            Lista con border.row
          </h2>
          <ul>
            {['Tokens', 'Theme', 'Palette'].map((item, i) => (
              <li
                key={item}
                className={cn(
                  'flex items-center justify-between px-space-lg py-space-md',
                  'border-b border-border-200 border-(length:--border-row)',
                  i === 0 && 'border-t-0',
                )}
              >
                <span className="text-text-100">{item}</span>
                <span className={badge.base}>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center gap-space-md py-space-lg text-text-300 text-sm">
          <span>Theme actual: {currentTheme}</span>
          <span>·</span>
          <span>Tokens: palette → theme → tokens</span>
        </footer>
      </div>
    </div>
  );
}

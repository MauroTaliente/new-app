import { type DemoTheme, ThemeSwitch } from './theme-switch';

export function OverviewPanel({
  currentTheme,
  setTheme,
  badgeClassName,
  codeClassName,
  sectionClassName,
  panelClassName,
}: {
  currentTheme: DemoTheme;
  setTheme: (theme: DemoTheme) => void;
  badgeClassName: string;
  codeClassName: string;
  sectionClassName: string;
  panelClassName: string;
}) {
  return (
    <section className={sectionClassName}>
      <div>
        <span className={badgeClassName}>Getting started</span>
        <h2 className="mt-space-sm text-(length:--text-2xl) font-semibold tracking-tight text-text-100">
          Demo modular para revisar componentes reales
        </h2>
        <p className="mt-space-sm max-w-3xl text-text-200 text-(length:--text-md)">
          Esta app queda como entorno de integracion para{' '}
          <code className={codeClassName}>@react33/react-ui</code>. Cada componente tendra
          su propio showcase con estados reales, mientras el tema sigue siendo global para validar
          tokens, contraste y comportamiento.
        </p>
      </div>

      <div className="grid gap-space-md xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <article className={panelClassName}>
          <h3 className="text-lg font-semibold text-text-100">Cambio de tema</h3>
          <p className="mt-space-xs text-sm text-text-200">
            El objetivo de la demo no es documentar solo props, sino probar el paquete publicado en
            condiciones reales de light/dark, variables CSS y clases de Tailwind v4.
          </p>
          <div className="mt-space-lg">
            <ThemeSwitch currentTheme={currentTheme} setTheme={setTheme} />
          </div>
          <p className="mt-space-md text-sm text-text-300">
            Tema actual: <span className="font-medium text-text-100">{currentTheme}</span>
          </p>
        </article>

        <article className={panelClassName}>
          <h3 className="text-lg font-semibold text-text-100">Convencion</h3>
          <div className="mt-space-md space-y-space-sm text-sm text-text-200">
            <p>1. Menu lateral para elegir el componente.</p>
            <p>2. Una vista principal con variantes, tamanos, estados y casos de uso.</p>
            <p>3. La demo siempre importa desde la entrada publicada del paquete, no desde archivos internos.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

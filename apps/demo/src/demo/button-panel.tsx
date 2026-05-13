import { Button, type ButtonSize, type ButtonVariant } from '@react33/react-ui';

const buttonVariantRows: Array<{
  label: string;
  variant: ButtonVariant;
  description: string;
}> = [
  { label: 'Main', variant: 'main', description: 'Accion primaria con mayor peso visual.' },
  { label: 'Outline', variant: 'outline', description: 'Acciones secundarias y contextos neutros.' },
  { label: 'Subtle', variant: 'subtle', description: 'Acciones livianas dentro de superficies cargadas.' },
  { label: 'Destructive', variant: 'destructive', description: 'Confirmaciones irreversibles o de riesgo.' },
  { label: 'Link', variant: 'link', description: 'Accion textual con jerarquia minima.' },
];

const buttonMatrixColumns: Array<{
  label: string;
  size: ButtonSize;
  iconSize: ButtonSize;
}> = [
  { label: 'Large', size: 'lg', iconSize: 'icon-lg' },
  { label: 'Medium', size: 'md', iconSize: 'icon' },
  { label: 'Small', size: 'sm', iconSize: 'icon-sm' },
  { label: 'Tiny', size: 'xs', iconSize: 'icon-xs' },
];

export function ButtonPanel({
  sectionClassName,
  panelClassName,
  badgeClassName,
  codeClassName,
}: {
  sectionClassName: string;
  panelClassName: string;
  badgeClassName: string;
  codeClassName: string;
}) {
  return (
    <section className={sectionClassName}>
      <div className="flex flex-wrap items-start justify-between gap-space-md">
        <div>
          <span className={badgeClassName}>Component</span>
          <h2 className="mt-space-sm text-(length:--text-2xl) font-semibold tracking-tight text-text-100">
            Button
          </h2>
          <p className="mt-space-sm max-w-3xl text-text-200 text-(length:--text-md)">
            Primer componente migrado. La vista muestra las variantes base, el estado persistente{' '}
            <code className={codeClassName}>active</code>, los tamanos y algunos overrides comunes del consumidor.
          </p>
        </div>
      </div>

      <article className={panelClassName}>
        <h3 className="text-lg font-semibold text-text-100">Filas por variante</h3>
        <p className="mt-space-xs max-w-3xl text-sm text-text-200">
          Una lectura horizontal por tipo de boton ayuda a validar rapido la jerarquia visual, el
          spacing interno y los estados mas comunes sin saltar entre bloques sueltos.
        </p>
        <div className="mt-space-lg overflow-hidden rounded-card border border-dashed border-border-200">
          <div className="divide-y divide-border-200">
            {buttonVariantRows.map((row) => (
              <div
                key={row.variant}
                className="grid gap-space-md px-space-lg py-space-lg lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-text-100">{row.label}</p>
                  <p className="mt-space-2xs text-xs text-text-300">{row.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-space-sm">
                  <Button variant={row.variant}>{row.label}</Button>
                  <Button variant={row.variant} active>Active</Button>
                  <Button variant={row.variant} disabled>Disabled</Button>
                  {row.variant !== 'link' ? (
                    <Button variant={row.variant} size="icon" aria-label={`${row.label} icon`}>
                      →
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            <div className="grid gap-space-md px-space-lg py-space-lg lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-text-100">Sizes</p>
                <p className="mt-space-2xs text-xs text-text-300">
                  Escala base para acciones compactas, normales e iconicas.
                </p>
              </div>
              <div className="flex flex-col gap-space-sm">
                <div className="flex flex-wrap items-center gap-space-sm">
                  {buttonMatrixColumns.map((column) => (
                    <Button key={column.label} size={column.size}>{column.label}</Button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-space-sm">
                  {buttonMatrixColumns.map((column) => (
                    <Button
                      key={`${column.label}-icon`}
                      variant="outline"
                      size={column.iconSize}
                      aria-label={`${column.label} icon`}
                    >
                      →
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article className={panelClassName}>
        <h3 className="text-lg font-semibold text-text-100">Casos de integracion</h3>
        <p className="mt-space-xs text-sm text-text-200">
          Casos puntuales que ayudan a validar que la API publica siga siendo flexible.
        </p>
        <div className="mt-space-lg flex flex-wrap items-center gap-space-md">
          <Button href="https://example.com" target="_blank" variant="outline">External link</Button>
          <Button variant="outline" className="rounded-pill px-space-xl">Pill override</Button>
          <Button variant="subtle" size="sm" min>Compact subtle</Button>
          <Button variant="subtle" active>Selected item</Button>
        </div>
      </article>
    </section>
  );
}

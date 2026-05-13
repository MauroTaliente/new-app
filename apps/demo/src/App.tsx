import { useEffect, useState } from 'react';
import { buildStyles } from '@react33/react-styles';
import { Button } from '@react33/react-ui';
import { ButtonPanel } from './demo/button-panel';
import { FormPanel } from './demo/form-panel';
import { OverlaysPanel } from './demo/overlays-panel';
import { OverviewPanel } from './demo/overview-panel';
import { type DemoTheme, ThemeSwitch } from './demo/theme-switch';
import { useTheme } from './theme/runtime';

const shellStyles = buildStyles({
  page: 'min-h-screen bg-bg-100 text-text-100',
  frame: 'mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-space-lg px-space-lg py-space-lg lg:px-space-2xl',
  hero: [
    'rounded-card border border-border-100 bg-bg-200 shadow-card',
    'px-space-lg py-space-lg lg:px-space-xl lg:py-space-xl',
  ],
  layout: 'grid gap-space-lg lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start',
  sidebar: 'rounded-card border border-border-100 bg-bg-200 p-space-md shadow-card lg:sticky lg:top-space-lg',
  panel: 'rounded-card border border-border-100 bg-bg-200 p-space-lg shadow-card',
  section: 'flex flex-col gap-space-lg',
  group: 'flex flex-col gap-space-sm',
  row: 'flex flex-wrap items-center gap-space-sm',
  badge: 'inline-flex items-center rounded-badge bg-bg-300 px-space-sm py-space-xs text-xs font-medium text-text-200',
  code: 'rounded-input bg-bg-300 px-space-xs py-space-2xs text-text-100',
} as const);

type DemoView = 'overview' | 'button' | 'form' | 'overlays';
const DEFAULT_VIEW: DemoView = 'button';

function isDemoView(value: string | null): value is DemoView {
  return (
    value === 'overview' ||
    value === 'button' ||
    value === 'form' ||
    value === 'overlays'
  );
}

function getViewFromUrl(): DemoView {
  if (typeof window === 'undefined') {
    return DEFAULT_VIEW;
  }
  const page = new URLSearchParams(window.location.search).get('page');
  return isDemoView(page) ? page : DEFAULT_VIEW;
}

const menuItems: Array<{ id: DemoView; label: string; summary: string; }> = [
  {
    id: 'overview',
    label: 'Overview',
    summary: 'Intro y cambio de tema',
  },
  {
    id: 'button',
    label: 'Button',
    summary: 'Variantes, tamanos y estados',
  },
  {
    id: 'form',
    label: 'Form',
    summary: 'Form, Field e inputs',
  },
  {
    id: 'overlays',
    label: 'Overlays',
    summary: 'Dialog, Popover, Tooltip, Tabs, Toast',
  },
];


export default function App() {
  const [currentTheme, setTheme] = useTheme();
  const [view, setView] = useState<DemoView>(() => getViewFromUrl());

  useEffect(() => {
    const onPopState = () => {
      setView(getViewFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const handleViewChange = (nextView: DemoView) => {
    setView(nextView);
    const params = new URLSearchParams(window.location.search);
    params.set('page', nextView);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.pushState({}, '', nextUrl);
  };

  return (
    <div className={shellStyles.page}>
      <div className={shellStyles.frame}>
        <header className={shellStyles.hero}>
          <div className="flex flex-col gap-space-md lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className={shellStyles.badge}>@react33/react-ui</span>
              <h1 className="mt-space-sm text-(length:--text-3xl) font-bold tracking-tight text-text-100">
                Component demo
              </h1>
              <p className="mt-space-sm text-text-200 text-(length:--text-md)">
                El objetivo ahora es revisar el paquete componente por componente, con una demo mas
                comoda para migrar, validar estados y detectar roturas de tema sin depender de un
                archivo unico gigante.
              </p>
            </div>
            <div>
              <ThemeSwitch currentTheme={currentTheme} setTheme={setTheme} />
            </div>
          </div>
        </header>

        <div className={shellStyles.layout}>
          <aside className={shellStyles.sidebar}>
            <div className="mb-space-md">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-300">
                Menu
              </p>
              <h2 className="mt-space-xs text-lg font-semibold text-text-100">Componentes</h2>
            </div>

            <nav className="flex flex-col gap-space-xs" aria-label="Demo sections">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="subtle"
                  active={view === item.id}
                  className="h-auto items-start justify-start px-space-md py-space-sm text-left"
                  onClick={() => handleViewChange(item.id)}
                >
                  <span className="flex flex-col items-start gap-space-2xs">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-text-300">{item.summary}</span>
                  </span>
                </Button>
              ))}
            </nav>
          </aside>

          <main className={shellStyles.panel}>
            {view === 'overview' ? (
              <OverviewPanel
                currentTheme={currentTheme}
                setTheme={setTheme}
                badgeClassName={shellStyles.badge}
                codeClassName={shellStyles.code}
                sectionClassName={shellStyles.section}
                panelClassName={shellStyles.panel}
              />
            ) : view === 'form' ? (
              <FormPanel
                codeClassName={shellStyles.code}
                badgeClassName={shellStyles.badge}
                panelClassName={shellStyles.panel}
                sectionClassName={shellStyles.section}
              />
            ) : view === 'overlays' ? (
              <OverlaysPanel
                codeClassName={shellStyles.code}
                badgeClassName={shellStyles.badge}
                panelClassName={shellStyles.panel}
                sectionClassName={shellStyles.section}
              />
            ) : (
              <ButtonPanel
                sectionClassName={shellStyles.section}
                panelClassName={shellStyles.panel}
                badgeClassName={shellStyles.badge}
                codeClassName={shellStyles.code}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

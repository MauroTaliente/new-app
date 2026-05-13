import { useState, type ReactNode } from 'react';
import { buildStyles } from '@maurotaliente/react-styles';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SimpleTooltip,
  TooltipProvider,
} from '@maurotaliente/react-ui';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToaster,
} from '@maurotaliente/react-ui';

interface OverlaysPanelProps {
  sectionClassName: string;
  panelClassName: string;
  badgeClassName: string;
  codeClassName: string;
}

const overlaysStyles = buildStyles({
  card: 'rounded-card border border-border-100 bg-bg-100 p-space-lg shadow-card',
  cardHeader: 'flex flex-row items-start justify-between gap-space-md',
  cardTitle: 'flex flex-col gap-space-2xs',
  cardLabel: 'text-(length:--text-md) font-semibold text-text-100',
  cardDescription: 'text-(length:--text-sm) text-text-300',
  cardActions: 'flex flex-wrap gap-space-sm pt-space-md',
  popoverList: 'flex flex-col gap-space-sm text-(length:--text-sm)',
});

const ExampleCard = ({
  title,
  description,
  children,
  badge,
  badgeClassName,
}: {
  title: string;
  description: string;
  children: ReactNode;
  badge: string;
  badgeClassName: string;
}) => (
  <section className={overlaysStyles.card}>
    <div className={overlaysStyles.cardHeader}>
      <div className={overlaysStyles.cardTitle}>
        <h3 className={overlaysStyles.cardLabel}>{title}</h3>
        <p className={overlaysStyles.cardDescription}>{description}</p>
      </div>
      <span className={badgeClassName}>{badge}</span>
    </div>
    <div className={overlaysStyles.cardActions}>{children}</div>
  </section>
);

export function OverlaysPanel({
  sectionClassName,
  badgeClassName,
  codeClassName,
}: OverlaysPanelProps) {
  const toaster = useToaster();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  return (
    <TooltipProvider>
      <ToastProvider swipeDirection="right">
        <div className={sectionClassName}>
          <header className="flex flex-col gap-space-sm">
            <h2 className="text-(length:--text-xl) font-semibold text-text-100">
              Overlays &amp; navigation
            </h2>
            <p className="text-text-300 text-(length:--text-sm)">
              Componentes Radix-wrapped en cascada: <code className={codeClassName}>react-ui-base</code>{' '}
              expone los primitives reutilizables (Dialog, Popover, Tooltip).{' '}
              <code className={codeClassName}>react-ui</code> agrega los terminales (DropdownMenu,
              Toast, Tabs). El consumer importa todo desde <code className={codeClassName}>react-ui</code>.
            </p>
          </header>

          <ExampleCard
            title="Dialog"
            description="Modal accesible con portal, focus trap y close por Escape. Vive en react-ui-base."
            badge="ui-base"
            badgeClassName={badgeClassName}
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="main">Abrir Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Confirmar publicación</DialogTitle>
                <DialogDescription>
                  Vas a publicar los 12 paquetes a npm bajo el scope{' '}
                  <code className={codeClassName}>@maurotaliente</code>. ¿Continuar?
                </DialogDescription>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="subtle">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="main">Publicar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </ExampleCard>

          <ExampleCard
            title="Popover"
            description="Contenedor flotante posicionado por Radix. Útil para filtros, ajustes y menús contextuales."
            badge="ui-base"
            badgeClassName={badgeClassName}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Ver configuraciones</Button>
              </PopoverTrigger>
              <PopoverContent align="start">
                <div className={overlaysStyles.popoverList}>
                  <strong>Idioma</strong>
                  <span className="text-text-300">Español (Argentina)</span>
                  <strong className="mt-2">Tema</strong>
                  <span className="text-text-300">Auto · sigue al SO</span>
                </div>
              </PopoverContent>
            </Popover>
          </ExampleCard>

          <ExampleCard
            title="Tooltip"
            description="Hint sobre un trigger. Lo usás en cualquier control con TooltipProvider en la raíz."
            badge="ui-base"
            badgeClassName={badgeClassName}
          >
            <SimpleTooltip content="Lo que activa el atajo Cmd+K">
              <Button variant="subtle">Hover acá</Button>
            </SimpleTooltip>
            <SimpleTooltip content="Acción destructiva" side="right">
              <Button variant="destructive">Borrar</Button>
            </SimpleTooltip>
          </ExampleCard>

          <ExampleCard
            title="DropdownMenu"
            description="Menú con teclado, secciones, checkbox items y separadores. Pieza terminal de react-ui."
            badge="ui"
            badgeClassName={badgeClassName}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Notificaciones ▾</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Canales</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={notifications.email}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, email: Boolean(v) }))
                  }
                >
                  Email
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={notifications.push}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, push: Boolean(v) }))
                  }
                >
                  Push
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={notifications.sms}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, sms: Boolean(v) }))
                  }
                >
                  SMS
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    toaster.show({
                      title: 'Preferencias guardadas',
                      description: JSON.stringify(notifications),
                      variant: 'success',
                    })
                  }
                >
                  Guardar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ExampleCard>

          <ExampleCard
            title="Tabs"
            description="Tabs accesibles con teclado, soporte para contenido independiente por panel."
            badge="ui"
            badgeClassName={badgeClassName}
          >
            <Tabs defaultValue="install" className="w-full">
              <TabsList>
                <TabsTrigger value="install">Instalación</TabsTrigger>
                <TabsTrigger value="use">Uso</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
              </TabsList>
              <TabsContent value="install">
                <code className={codeClassName}>
                  pnpm add @maurotaliente/react-ui @maurotaliente/react-styles
                </code>
              </TabsContent>
              <TabsContent value="use">
                <code className={codeClassName}>{`import { Dialog, Button } from '@maurotaliente/react-ui';`}</code>
              </TabsContent>
              <TabsContent value="testing">
                <code className={codeClassName}>pnpm test</code>
              </TabsContent>
            </Tabs>
          </ExampleCard>

          <ExampleCard
            title="Toast"
            description="Notificaciones imperativas con useToaster(). Soporta variantes success/error/default."
            badge="ui"
            badgeClassName={badgeClassName}
          >
            <Button
              variant="main"
              onClick={() =>
                toaster.show({
                  title: 'Guardado',
                  description: 'Tus cambios se aplicaron correctamente.',
                  variant: 'success',
                })
              }
            >
              Toast success
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                toaster.show({
                  title: 'Error al guardar',
                  description: 'Intentá de nuevo en unos segundos.',
                  variant: 'error',
                })
              }
            >
              Toast error
            </Button>
          </ExampleCard>
        </div>

        {toaster.queue.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            duration={t.duration}
            onOpenChange={(open) => {
              if (!open) toaster.dismiss(t.id);
            }}
          >
            <div className="flex flex-col gap-1">
              {t.title ? <ToastTitle>{t.title}</ToastTitle> : null}
              {t.description ? <ToastDescription>{t.description}</ToastDescription> : null}
            </div>
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </TooltipProvider>
  );
}

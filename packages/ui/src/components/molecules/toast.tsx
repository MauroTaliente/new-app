'use client';

import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { buildStyles, cn, type ClassValue } from '@react33/react-styles';
import { Icon } from '@react33/react-ui-base';

export const toastStyles = buildStyles({
  viewport: [
    'fixed bottom-0 right-0 z-[100] m-space-md flex max-h-screen w-[min(100vw,24rem)] flex-col gap-space-sm outline-none',
  ],
  root: [
    'group relative flex w-full items-start gap-space-sm overflow-hidden rounded-md border p-space-md shadow-dropdown',
    'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-80',
  ],
  variant: {
    default: 'border-border-200 bg-bg-100 text-text-100',
    success: 'border-positive-100 bg-bg-100 text-text-100',
    error: 'border-negative-100 bg-bg-100 text-text-100',
  },
  title: 'text-sm font-semibold',
  description: 'text-sm text-text-300',
  close: [
    'rounded-md p-1 text-text-300 transition-colors',
    'hover:text-text-100 hover:bg-bg-300',
  ],
});

export type ToastVariant = keyof typeof toastStyles.variant;

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = forwardRef<
  ElementRef<typeof ToastPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport> & { className?: ClassValue }
>(function ToastViewport({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Viewport ref={ref} className={cn(toastStyles.viewport, className)} {...props} />
  );
});

export interface ToastRootProps
  extends Omit<ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, 'className'> {
  variant?: ToastVariant;
  className?: ClassValue;
}

export const Toast = forwardRef<ElementRef<typeof ToastPrimitive.Root>, ToastRootProps>(
  function Toast({ className, variant = 'default', ...props }, ref) {
    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(toastStyles.root, toastStyles.variant[variant], className)}
        {...props}
      />
    );
  },
);

export const ToastTitle = forwardRef<
  ElementRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title> & { className?: ClassValue }
>(function ToastTitle({ className, ...props }, ref) {
  return <ToastPrimitive.Title ref={ref} className={cn(toastStyles.title, className)} {...props} />;
});

export const ToastDescription = forwardRef<
  ElementRef<typeof ToastPrimitive.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description> & { className?: ClassValue }
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Description
      ref={ref}
      className={cn(toastStyles.description, className)}
      {...props}
    />
  );
});

export const ToastClose = forwardRef<
  ElementRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close> & { className?: ClassValue }
>(function ToastClose({ className, children, ...props }, ref) {
  return (
    <ToastPrimitive.Close
      ref={ref}
      className={cn(toastStyles.close, className)}
      toast-close=""
      {...props}
    >
      {children ?? <Icon name="IconX" size={14} />}
    </ToastPrimitive.Close>
  );
});

export const ToastAction = forwardRef<
  ElementRef<typeof ToastPrimitive.Action>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Action> & { className?: ClassValue }
>(function ToastAction({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Action
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border-200 bg-transparent px-3 text-sm text-text-200 hover:bg-bg-300',
        className,
      )}
      {...props}
    />
  );
});

/* -------------------------------------------------------------------------
 * useToaster — small hook to manage toasts imperatively in app code.
 * Apps mount <ToastProvider>{toaster.queue.map(...)}</ToastProvider>
 * and call toaster.show({...}) from anywhere.
 * ------------------------------------------------------------------------*/
export interface ToastItem {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

export interface UseToasterApi {
  queue: ToastItem[];
  show: (item: Omit<ToastItem, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

export function useToaster(): UseToasterApi {
  const [queue, setQueue] = useState<ToastItem[]>([]);

  const show = useCallback<UseToasterApi['show']>((item) => {
    const id = item.id ?? Math.random().toString(36).slice(2);
    setQueue((prev) => [...prev, { variant: 'default', duration: 4000, ...item, id }]);
    return id;
  }, []);

  const dismiss = useCallback<UseToasterApi['dismiss']>((id) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return useMemo(() => ({ queue, show, dismiss }), [queue, show, dismiss]);
}

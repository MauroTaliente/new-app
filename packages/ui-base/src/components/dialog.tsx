'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { buildStyles, cn, type ClassValue } from '@maurotaliente/react-styles';
import { Icon } from './icon';

export const dialogStyles = buildStyles({
  overlay: [
    'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  ],
  content: [
    'fixed left-1/2 top-1/2 z-50 w-[min(90vw,32rem)] -translate-x-1/2 -translate-y-1/2',
    'bg-bg-100 text-text-100 border border-border-200 rounded-card shadow-dropdown',
    'p-space-lg flex flex-col gap-space-md outline-none',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  ],
  title: 'text-(length:--text-lg) font-semibold text-text-100',
  description: 'text-(length:--text-sm) text-text-300',
  close: [
    'absolute right-3 top-3 rounded-md p-1 text-text-300 transition-colors',
    'hover:bg-bg-300 hover:text-text-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-200/50',
  ],
  footer: 'flex flex-row justify-end gap-space-sm pt-space-md',
});

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { className?: ClassValue }
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay ref={ref} className={cn(dialogStyles.overlay, className)} {...props} />
  );
});

export interface DialogContentProps
  extends Omit<ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, 'className'> {
  className?: ClassValue;
  hideCloseButton?: boolean;
  closeAriaLabel?: string;
  children?: ReactNode;
}

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  { className, children, hideCloseButton = false, closeAriaLabel = 'Close', ...props },
  ref,
) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogStyles.content, className)}
        {...props}
      >
        {children}
        {hideCloseButton ? null : (
          <DialogPrimitive.Close className={cn(dialogStyles.close)} aria-label={closeAriaLabel}>
            <Icon name="IconX" size={18} />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & { className?: ClassValue }
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title ref={ref} className={cn(dialogStyles.title, className)} {...props} />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & { className?: ClassValue }
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(dialogStyles.description, className)}
      {...props}
    />
  );
});

export interface DialogFooterProps {
  className?: ClassValue;
  children?: ReactNode;
}

export const DialogFooter = ({ className, children }: DialogFooterProps) => (
  <div className={cn(dialogStyles.footer, className)}>{children}</div>
);

'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { buildStyles, cn, type ClassValue } from '@maurotaliente/react-styles';

export const tooltipStyles = buildStyles({
  content: [
    'z-50 overflow-hidden rounded-md bg-text-100 px-3 py-1.5',
    'text-(length:--text-xs) text-bg-100 shadow-card',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  ],
});

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipContentProps
  extends Omit<ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>, 'className'> {
  className?: ClassValue;
}

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(tooltipStyles.content, className)}
      {...props}
    />
  );
});

export interface SimpleTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  className?: ClassValue;
}

/** One-liner tooltip wrapper for common case. */
export const SimpleTooltip = ({
  content,
  children,
  side = 'top',
  delayDuration = 200,
  className,
}: SimpleTooltipProps) => (
  <Tooltip delayDuration={delayDuration}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side} className={className}>
      {content}
    </TooltipContent>
  </Tooltip>
);

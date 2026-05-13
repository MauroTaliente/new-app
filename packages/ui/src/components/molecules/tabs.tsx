'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { buildStyles, cn, type ClassValue } from '@maurotaliente/react-styles';

export const tabsStyles = buildStyles({
  root: 'flex flex-col gap-space-md',
  list: [
    'inline-flex h-10 items-center justify-start rounded-md bg-bg-200 p-1 text-text-300',
  ],
  trigger: [
    'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5',
    'text-sm font-medium ring-offset-bg-100 transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200/50',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=active]:bg-bg-100 data-[state=active]:text-text-100 data-[state=active]:shadow-card',
  ],
  content: [
    'mt-2 ring-offset-bg-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200/50',
  ],
});

export const Tabs = forwardRef<
  ElementRef<typeof TabsPrimitive.Root>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Root> & { className?: ClassValue }
>(function Tabs({ className, ...props }, ref) {
  return <TabsPrimitive.Root ref={ref} className={cn(tabsStyles.root, className)} {...props} />;
});

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { className?: ClassValue }
>(function TabsList({ className, ...props }, ref) {
  return <TabsPrimitive.List ref={ref} className={cn(tabsStyles.list, className)} {...props} />;
});

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { className?: ClassValue }
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger ref={ref} className={cn(tabsStyles.trigger, className)} {...props} />
  );
});

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & { className?: ClassValue }
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content ref={ref} className={cn(tabsStyles.content, className)} {...props} />
  );
});

'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { buildStyles, cn, type ClassValue } from '@maurotaliente/react-styles';
import { Icon } from '@maurotaliente/react-ui-base';

export const dropdownMenuStyles = buildStyles({
  content: [
    'z-50 min-w-[10rem] overflow-hidden rounded-md border border-border-200 bg-bg-100 p-1 shadow-dropdown',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  ],
  item: [
    'relative flex cursor-pointer select-none items-center gap-space-sm rounded-sm px-3 py-2 text-sm text-text-100 outline-none',
    'transition-colors',
    'focus:bg-bg-300 focus:text-text-100',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  ],
  separator: '-mx-1 my-1 h-px bg-border-200',
  label: 'px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-300',
  checkboxIndicator: 'absolute left-2 flex h-4 w-4 items-center justify-center',
});

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export interface DropdownMenuContentProps
  extends Omit<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>, 'className'> {
  className?: ClassValue;
}

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(dropdownMenuStyles.content, className)}
        {...props}
      />
    </DropdownMenuPortal>
  );
});

export interface DropdownMenuItemProps
  extends Omit<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>, 'className'> {
  className?: ClassValue;
}

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(dropdownMenuStyles.item, className)}
      {...props}
    />
  );
});

export interface DropdownMenuCheckboxItemProps
  extends Omit<ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>, 'className'> {
  className?: ClassValue;
}

export const DropdownMenuCheckboxItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(function DropdownMenuCheckboxItem({ className, children, checked, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(dropdownMenuStyles.item, 'pl-8', className)}
      {...props}
    >
      <span className={dropdownMenuStyles.checkboxIndicator}>
        <DropdownMenuPrimitive.ItemIndicator>
          <Icon name="IconCheck" size={14} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & { className?: ClassValue }
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn(dropdownMenuStyles.separator, className)}
      {...props}
    />
  );
});

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { className?: ClassValue }
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(dropdownMenuStyles.label, className)}
      {...props}
    />
  );
});

'use client';

import { forwardRef, type ForwardedRef, type ReactNode } from 'react';
import { AnimatePresence, type HTMLMotionProps, motion } from 'motion/react';
import { cn } from '@react33/react-styles';
import { Icon } from './icon';

export interface OverlayProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode;
  active?: boolean;
  duration?: number;
  delay?: number;
  z?: number;
  variant?: 'overlay' | 'loader';
  mode?: 'cover' | 'conditional';
}

export const Overlay = forwardRef<HTMLDivElement, OverlayProps>(function Overlay(
  {
    active = true,
    className = '',
    duration = 0.2,
    delay = 0.3,
    z = 100,
    variant = 'overlay',
    mode = 'cover',
    children,
    ...props
  },
  receivedRef: ForwardedRef<HTMLDivElement>,
) {
  return (
    <motion.div
      {...props}
      ref={receivedRef}
      role="status"
      className={cn(
        'relative flex shrink-0',
        active ? 'overflow-hidden' : '',
        className,
      )}
      initial={false}
    >
      {(mode === 'conditional' ? !active : true) ? children : null}
      <AnimatePresence>
        {active ? (
          <motion.div
            style={{ zIndex: z }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, delay }}
            className={cn(
              'block bg-bg-200 absolute inset-0 w-full overflow-hidden',
            )}
          >
            <div
              style={{ zIndex: z }}
              className={cn(
                'flex justify-center items-center absolute inset-0 overflow-hidden w-full',
                variant === 'loader' ? 'bg-bg-100' : 'bg-bg-100 animate-pulse',
              )}
            >
              {variant === 'loader' ? (
                <Icon name="IconLoader2" className="text-text-100 animate-spin" />
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
});

Overlay.displayName = 'Overlay';

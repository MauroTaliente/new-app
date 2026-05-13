import {
  forwardRef,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactElement,
  type Ref,
} from 'react';
import { buildStyles, type ClassValue } from '@react33/react-styles';


/** Compiled sheet (module scope). */
export const buttonStyles = buildStyles({
  area: 'relative flex flex-col gap-1',
  min: 'h-auto w-auto min-w-0 px-0 py-0',
  base: [
    'relative flex flex-row justify-center items-center whitespace-nowrap',
    'rounded-md font-medium box-border gap-1 cursor-pointer',
    'transition-colors outline-none',
    'disabled:cursor-not-allowed',
  ],
  variant: {
    main: [
      'bg-accent-200 text-accent-alt-200 border border-transparent',
      'enabled:hover:bg-accent-100 enabled:hover:text-accent-alt-100',
      'enabled:active:bg-accent-100 enabled:active:text-accent-alt-100',
      'focus-visible:ring-2 focus-visible:ring-accent-200/50',
      'disabled:bg-disabled-bg disabled:text-disabled-text',
    ],

    outline: [
      'bg-transparent text-accent-200 border border-accent-200',
      'enabled:hover:bg-accent-200/10 enabled:hover:text-accent-100 enabled:hover:border-accent-100',
      'enabled:active:bg-accent-200/10 enabled:active:text-accent-100 enabled:active:border-accent-100',
      'focus-visible:ring-2 focus-visible:ring-accent-200/50',
      'disabled:border-disabled-border disabled:text-disabled-text',
    ],

    subtle: [
      'bg-transparent text-accent-200 border border-transparent',
      'enabled:hover:bg-accent-200/10 enabled:hover:text-accent-100',
      'enabled:active:bg-accent-200/10 enabled:active:text-accent-100',
      'focus-visible:ring-2 focus-visible:ring-accent-200/50',
      'disabled:text-disabled-text',
    ],

    text: [
      'bg-transparent text-accent-200 border border-transparent',
      'enabled:hover:text-accent-100',
      'enabled:active:text-accent-100',
      'focus-visible:text-accent-100',
      'disabled:text-disabled-text',
    ],

    link: [
      'text-accent-200 underline-offset-4',
      'enabled:hover:text-accent-100 enabled:hover:underline',
      'enabled:active:text-accent-100 enabled:active:underline',
      'focus-visible:underline',
      'disabled:text-disabled-text',
    ],

    destructive: [
      'bg-negative-200 text-white border border-transparent',
      'enabled:hover:bg-negative-100',
      'enabled:active:bg-negative-100',
      'focus-visible:ring-2 focus-visible:ring-negative-300',
      'disabled:bg-disabled-bg disabled:text-disabled-text',
    ],
  },

  size: {
    xs: 'h-6 gap-0.5 px-2 text-xs',
    sm: 'h-9 gap-0.75 px-3 text-sm',
    md: 'h-10 gap-1 px-4 text-base',
    lg: 'h-12 gap-1.5 px-5 text-lg',

    'icon-xs': 'h-6 w-6 min-w-6 p-0 text-xs',
    icon: 'h-10 w-10 min-w-10 p-0 text-sm',
    'icon-sm': 'h-9 w-9 min-w-9 p-0 text-sm',
    'icon-lg': 'h-12 w-12 min-w-12 p-0 text-base',
  },
} as const);

/** Types */
export type ButtonVariant = keyof typeof buttonStyles.variant;
export type ButtonSize = keyof typeof buttonStyles.size;

export type CommonButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: ClassValue;
  withArea?: boolean;
  areaClassName?: ClassValue;
  disabled?: boolean;
  active?: boolean;
  min?: boolean;
};

export type ButtonProps = CommonButtonProps & (
  | (Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'disabled' | 'active'> & { href?: undefined; })
  | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'active'> & { href: string })
);

export type ButtonElement = HTMLButtonElement | HTMLAnchorElement;

/** Component */
export const Button = forwardRef<ButtonElement, ButtonProps>(({
  className,
  variant = 'main',
  size = 'md',
  disabled = false,
  active = false,
  min = false,
  children,
  withArea = false,
  areaClassName,
  href,
  ...rest
}, ref) => {
  const isAnchor = href !== undefined;
  const resolvedStyles = buildStyles({
    root: [
      active && 'active',
      buttonStyles.base,
      buttonStyles.variant[variant],
      buttonStyles.size[size],
      min && buttonStyles.min,
      className,
    ],
    area: [
      buttonStyles.area,
      areaClassName,
    ],
  });

  let node: ReactElement;
  if (isAnchor) {
    const { onClick, rel, target, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    const resolvedRel = target === '_blank' ? (rel ?? 'noopener noreferrer') : rel;
    node = (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={resolvedRel}
        className={resolvedStyles.root}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        {...anchorRest}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
      >
        {children}
      </a>
    );
  } else {
    const { type = 'button', ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    node = (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        className={resolvedStyles.root}
        disabled={disabled}
        {...buttonRest}
      >
        {children}
      </button>
    );
  }

  if (withArea) return <div className={resolvedStyles.area}>{node}</div>;
  return node;
});

Button.displayName = 'Button';

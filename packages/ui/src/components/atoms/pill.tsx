import { buildStyles, cn, type ClassValue } from '@react33/react-styles';
import { Icon } from '@react33/react-ui-base';

export interface PillProps {
  label: string;
  className?: ClassValue;
  removable?: boolean;
  removeAriaLabel?: string;
  onRemove?: () => void;
}

const pillStyleMap = {
  root: [
    'inline-flex items-center gap-2 rounded-xl border border-border-200 bg-bg-100',
    'px-4 py-2 text-sm font-semibold text-text-100 transition-colors',
    'hover:bg-bg-200 focus-within:border-accent-100 focus-within:ring-2 focus-within:ring-accent-200/60',
  ],
  removeButton: [
    'flex h-5 w-5 items-center justify-center rounded text-text-300 transition-colors',
    'hover:text-text-100 focus:outline-none',
  ],
} as const;

export const pillStyles = buildStyles(pillStyleMap);

export const Pill = ({
  label,
  className,
  removable = false,
  removeAriaLabel,
  onRemove,
}: PillProps) => {
  const resolvedStyles = buildStyles({
    root: [pillStyleMap.root, className],
    removeButton: pillStyleMap.removeButton,
  });

  return (
    <span className={resolvedStyles.root}>
      {label}
      {removable && onRemove ? (
        <button
          type="button"
          data-chip-remove="true"
          className={cn(resolvedStyles.removeButton)}
          aria-label={removeAriaLabel ?? `Remove ${label}`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
        >
          <Icon name="IconX" size={12} />
        </button>
      ) : null}
    </span>
  );
};

Pill.displayName = 'Pill';

import { buildStyles, type ClassValue } from '@maurotaliente/react-styles';
import { type ReactNode } from 'react';
import { Icon, type IconName } from '@maurotaliente/react-ui-base';

const tagStyleMap = {
  root: 'inline-flex items-center justify-center gap-1 rounded-full',
  title: 'caps',
  color: {
    inactive: 'text-text-300 bg-bg-300 dark:text-text-300 dark:bg-bg-300',
    grey: 'text-text-100 bg-bg-300',
    orange: 'text-orange-500 bg-orange-100 dark:text-orange-400 dark:bg-orange-900',
    green: 'text-green-600 bg-green-200 dark:text-green-400 dark:bg-green-900',
    blue: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-800',
    red: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900',
    yellow: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900',
    violet: 'text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900',
  },
  size: {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  },
  icon: {
    sm: 14,
    md: 18,
    lg: 22,
  },
} as const;

export const tagStyles = buildStyles(tagStyleMap);

export type TagColor = keyof typeof tagStyleMap.color;
export type TagSize = keyof typeof tagStyleMap.size;

export interface TagProps {
  label?: string;
  color?: TagColor;
  size?: TagSize;
  icon?: IconName;
  className?: ClassValue;
  mode?: 'default' | 'reactive';
  active?: boolean;
  children?: ReactNode;
}

export const Tag = ({
  label,
  color = 'grey',
  size = 'md',
  icon,
  className,
  mode = 'default',
  active = true,
  children,
}: TagProps) => {
  const isInactive = mode === 'reactive' && !active;
  const resolvedStyles = buildStyles({
    root: [
      tagStyleMap.root,
      tagStyleMap.size[size],
      isInactive ? tagStyleMap.color.inactive : tagStyleMap.color[color],
      className,
    ],
    title: [
      tagStyleMap.title,
      isInactive ? tagStyleMap.color.inactive : tagStyleMap.color[color],
    ],
  });

  return (
    <span className={resolvedStyles.root}>
      {icon ? <Icon name={icon} size={tagStyleMap.icon[size]} /> : null}
      {label ? <span className={resolvedStyles.title}>{label}</span> : null}
      {children}
    </span>
  );
};

Tag.displayName = 'Tag';

'use client';

import { useMemo, type ComponentType, type FC } from 'react';
import * as icons from '@tabler/icons-react';
import type { IconProps as TablerSvgProps } from '@tabler/icons-react';

export type IconName = keyof typeof icons;

export interface IconProps extends TablerSvgProps {
  name: IconName;
  show?: boolean;
}

/** Resolves Tabler icon components by name (same pattern as the legacy kit). */
export const Icon: FC<IconProps> = ({ name, show = true, ...props }) => {
  const CurrentIcon = useMemo(
    () => icons[name] as ComponentType<TablerSvgProps>,
    [name],
  );
  return show ? <CurrentIcon {...props} /> : null;
};

Icon.displayName = 'Icon';

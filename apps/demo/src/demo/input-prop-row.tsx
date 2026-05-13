import { Tag, type TagColor } from '@react33/react-ui';

export type InputPropRowConfig<TProps extends object> = {
  keys: ReadonlyArray<Extract<keyof TProps, string>>;
  booleanKeys: ReadonlyArray<Extract<keyof TProps, string>>;
  enumDefaults: Partial<Record<Extract<keyof TProps, string>, unknown>>;
  numberDefaults: Partial<Record<Extract<keyof TProps, string>, number>>;
  alwaysInclude?: Partial<TProps>;
};

function formatPropValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => String(item)).join(', ')}]`;
  }
  return String(value);
}

function resolvePropTagColor<TProps extends object>(
  key: string,
  value: unknown,
  config: InputPropRowConfig<TProps>,
): TagColor {
  if (config.booleanKeys.includes(key as Extract<keyof TProps, string>)) {
    return Boolean(value) ? 'green' : 'grey';
  }

  if (key in config.enumDefaults) {
    return value === config.enumDefaults[key as keyof typeof config.enumDefaults] ? 'violet' : 'blue';
  }

  if (key in config.numberDefaults) {
    return value === config.numberDefaults[key as keyof typeof config.numberDefaults] ? 'violet' : 'blue';
  }

  return 'grey';
}

export function InputPropRow<TProps extends object>({
  config,
  ...props
}: Partial<TProps> & { config: InputPropRowConfig<TProps> }) {
  const propsMap = props as Record<string, unknown>;
  const filteredProps = config.keys.reduce<Record<string, unknown>>((acc, key) => {
    const nextValue = propsMap[String(key)];
    if (nextValue !== undefined) {
      acc[String(key)] = nextValue;
    }
    return acc;
  }, {});

  const normalizedProps: Record<string, unknown> = {
    ...(config.alwaysInclude as Record<string, unknown> | undefined),
    ...filteredProps,
  };

  return (
    <div className="flex flex-wrap items-center gap-space-xs">
      {Object.entries(normalizedProps).map(([key, value]) => (
        <Tag
          key={key}
          size="sm"
          color={resolvePropTagColor(key, value, config)}
          label={`${key}: ${formatPropValue(value)}`}
        />
      ))}
    </div>
  );
}

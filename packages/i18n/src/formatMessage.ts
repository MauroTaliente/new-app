import IntlMessageFormat from 'intl-messageformat';

export type MessageValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

/**
 * ICU MessageFormat (plurals, selects, `{name}` placeholders) for dictionary strings.
 * Parallel to `ct` (React-rich); use this for plain strings or before passing to `ct`.
 */
export function formatMessage(
  locale: string,
  pattern: string,
  values?: MessageValues,
): string {
  const fmt = new IntlMessageFormat(pattern, locale);
  return String(fmt.format(values ?? {}));
}

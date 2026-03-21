/**
 * Identity helper for message maps: keeps `as const` inference and documents intent
 * for ICU strings consumed by `formatMessage` or rich `ct` templates.
 */
export function defineMessages<const T extends Record<string, string>>(messages: T): T {
  return messages;
}

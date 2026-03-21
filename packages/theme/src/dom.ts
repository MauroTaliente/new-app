/**
 * Applies theme class transitions on `body` and `document.documentElement` + `data-theme`.
 * Pure with respect to React; testable with a mocked `document`.
 */
export function applyThemeToDocument(prev: string, next: string): void {
  if (typeof document === 'undefined') return;
  if (prev === next) return;
  document.body.classList.remove(prev);
  document.body.classList.add(next);
  document.body.dataset.theme = next;
  document.documentElement.classList.remove(prev);
  document.documentElement.classList.add(next);
}

/** First mount (e.g. ThemeBodySync): add only, no `prev` transition. */
export function mountThemeToDocument(theme: string): void {
  if (typeof document === 'undefined') return;
  document.body.classList.add(theme);
  document.body.dataset.theme = theme;
  document.documentElement.classList.add(theme);
}

export function unmountThemeFromDocument(theme: string): void {
  if (typeof document === 'undefined') return;
  document.body.classList.remove(theme);
  document.documentElement.classList.remove(theme);
}

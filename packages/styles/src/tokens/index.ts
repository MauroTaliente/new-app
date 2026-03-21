import { defaultTokensData } from '../runtime/defaultTokensData.js';

const data = defaultTokensData as unknown as {
  theme: readonly string[];
  defaultTheme?: string;
  color: Record<string, string>;
  screen: Record<string, string>;
  space: Record<string, string>;
  radius: Record<string, string>;
  border?: Record<string, string>;
  shadow?: Record<string, string>;
  text: Record<string, string>;
  font: Record<string, string>;
  leading?: Record<string, string>;
  weight?: Record<string, string>;
  duration?: Record<string, string>;
  easing?: Record<string, string>;
  z?: Record<string, string>;
  line: Record<string, string>;
  cols: number;
};

export const theme = data.theme as readonly ['light', 'dark'];
export const defaultTheme = (data.defaultTheme ?? data.theme?.[0] ?? 'light') as (typeof theme)[number];
export const color = data.color;
export const screen = data.screen;
export const space = data.space;
export const radius = data.radius;
export const border = data.border ?? {};
export const shadow = data.shadow ?? {};
export const text = data.text;
export const font = data.font;
export const leading = data.leading ?? {};
export const weight = data.weight ?? {};
export const duration = data.duration ?? {};
export const easing = data.easing ?? {};
export const z = data.z ?? {};
export const line = data.line;
export const cols = data.cols;

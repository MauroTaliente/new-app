import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import {
  LocaleProvider,
  persistLocaleChoice,
  resolveAppLocale,
} from './lib/i18n';
import {
  getInitialTheme,
  persistTheme,
  ThemeBodySync,
  ThemeProvider,
} from './lib/theme';

const initialLocale = resolveAppLocale();
const initialTheme = getInitialTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider value={initialLocale} onLocaleChange={persistLocaleChoice}>
      <ThemeProvider value={initialTheme} onThemeChange={persistTheme}>
        <ThemeBodySync />
        <App />
      </ThemeProvider>
    </LocaleProvider>
  </React.StrictMode>,
);

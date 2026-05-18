import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import {
  LocaleProvider,
  getInitialLocale,
  persistLocale,
} from './lib/i18n';
import {
  getInitialTheme,
  persistTheme,
  ThemeBodySync,
  ThemeProvider,
} from './lib/theme';

const initialLocale = getInitialLocale();
const initialTheme = getInitialTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider value={initialLocale} onLocaleChange={persistLocale}>
      <ThemeProvider value={initialTheme} onThemeChange={persistTheme}>
        <ThemeBodySync />
        <App />
      </ThemeProvider>
    </LocaleProvider>
  </React.StrictMode>,
);

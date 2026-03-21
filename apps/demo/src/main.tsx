import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider, ThemeBodySync } from './theme/runtime';
import { getInitialTheme, persistTheme } from './theme/themePersistence';
import { styles } from './theme/styles.generated';

const defaultTheme = styles.meta.defaultTheme;
const initialTheme = getInitialTheme(defaultTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider value={initialTheme} onThemeChange={persistTheme}>
      <ThemeBodySync />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

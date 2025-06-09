import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store, persistor } from './store/store'; // Import the Redux store and persistor
import { theme } from './theme/theme';
import App from './App';
import './styles.css'; // Keep global styles if needed, or rely solely on MUI/Emotion

// Find the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create a React root
const root = ReactDOM.createRoot(rootElement);

// Render the App component wrapped in Providers
root.render(
  <React.StrictMode>
    <Provider store={store}>       {/* Redux Provider */}
      <PersistGate loading={null} persistor={persistor}> {/* Redux Persist Gate */}
        <ThemeProvider theme={theme}> {/* MUI Theme Provider */}
          <CssBaseline />            {/* MUI basic CSS reset */}
          <App />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
); 
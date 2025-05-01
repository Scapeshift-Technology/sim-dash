import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { store } from './store/store'; // Import the Redux store
import App from './App';
import './styles.css'; // Keep global styles if needed, or rely solely on MUI/Emotion

// Find the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create a basic MUI theme (can be customized later)
const theme = createTheme({
  palette: {
    mode: 'light', // Or 'dark'
    // Define primary/secondary colors, etc.
  },
});

// Create a React root
const root = ReactDOM.createRoot(rootElement);

// Render the App component wrapped in Providers
root.render(
  <React.StrictMode>
    <Provider store={store}>       {/* Redux Provider */}
      <ThemeProvider theme={theme}> {/* MUI Theme Provider */}
        <CssBaseline />            {/* MUI basic CSS reset */}
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
); 
import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',  // A nice blue shade that works well in dark mode
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#ce93d8',  // A complementary purple shade
      light: '#f3e5f5',
      dark: '#ab47bc',
    },
    background: {
      default: '#121212',  // Material UI's recommended dark background
      paper: '#1e1e1e',    // Slightly lighter than the background for cards/surfaces
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',  // Removes the default paper texture
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,  // Slightly rounded buttons
        },
      },
    },
  },
});

export default darkTheme; 
import { createTheme } from '@mui/material';

// Simulectra Theme
// A modern, technology-focused theme that combines the precision of simulation
// with the dynamism of electrical/technological elements

export const theme = createTheme({
  palette: {
    mode: 'dark',
    
    // Primary: Core brand color
    // Used for main actions, key UI elements, and primary buttons
    // A vibrant electric blue that symbolizes technology and innovation
    primary: {
      main: '#2196F3',      // Electric blue - our main brand color
      light: '#64B5F6',     // Lighter shade for hover states and secondary elements
      dark: '#1976D2',      // Darker shade for active states and emphasis
      contrastText: '#fff'  // White text for optimal readability
    },

    // Secondary: Complementary accent color
    // Used for floating action buttons, selection controls, and highlights
    // A modern purple that adds sophistication and creativity
    secondary: {
      main: '#7C4DFF',      // Vibrant purple - adds creative energy
      light: '#B47CFF',     // Lighter purple for subtle accents
      dark: '#5E35B1',      // Deeper purple for stronger emphasis
      contrastText: '#fff'
    },

    // Error: For error states and critical actions
    // A carefully chosen red that's visible but not harsh
    error: {
      main: '#FF5252',      // Soft red that's visible but not alarming
      light: '#FF867C',     // Lighter red for backgrounds
      dark: '#D32F2F',      // Deeper red for critical emphasis
      contrastText: '#fff'
    },

    // Warning: For cautionary messages and states
    // An amber tone that's attention-grabbing but not severe
    warning: {
      main: '#FFB74D',      // Warm amber for warnings
      light: '#FFE97D',     // Light amber for subtle warnings
      dark: '#F57C00',      // Deep amber for serious warnings
      contrastText: '#000'
    },

    // Info: For informational messages and states
    // A cyan tone that's informative and tech-focused
    info: {
      main: '#00BCD4',      // Cyan for information
      light: '#4DD0E1',     // Light cyan for info backgrounds
      dark: '#0097A7',      // Deep cyan for emphasized info
      contrastText: '#fff'
    },

    // Success: For success states and completed actions
    // A green that's positive but fits our tech theme
    success: {
      main: '#00E676',      // Electric green for success
      light: '#69F0AE',     // Light green for success backgrounds
      dark: '#00C853',      // Deep green for emphasized success
      contrastText: '#000'
    },

    // Background colors for different surface elements
    background: {
      default: '#121212',    // Main app background - deep dark for contrast
      paper: '#1E1E1E',      // Elevated surfaces - slightly lighter
    },

    // Text colors for different emphasis levels
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',    // High emphasis text
      secondary: 'rgba(255, 255, 255, 0.60)',   // Medium emphasis text
      disabled: 'rgba(255, 255, 255, 0.38)'     // Disabled text
    },

    // Divider color for separation of elements
    divider: 'rgba(255, 255, 255, 0.12)',
  },

  // Custom color tokens specific to simulectra
  // These can be accessed via theme.palette.simulectra[key]
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--simulectra-gradient-primary': 'linear-gradient(45deg, #2196F3 30%, #7C4DFF 90%)',
          '--simulectra-gradient-dark': 'linear-gradient(45deg, #1976D2 30%, #5E35B1 90%)',
          '--simulectra-highlight': '#64B5F6',
          '--simulectra-lowlight': '#1976D2',
        }
      }
    }
  }
}); 
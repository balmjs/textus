import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
        colors: {
          // Beach & Ocean Theme - Light Mode
          primary: '#0288D1', // Vibrant Ocean Blue
          'primary-darken-1': '#0277BD',
          secondary: '#FFB300', // Sun Gold
          'secondary-darken-1': '#FFA000',
          tertiary: '#00BCD4', // Cyan Wave
          error: '#E53935',
          info: '#1976D2',
          success: '#43A047',
          warning: '#FB8C00',
          surface: '#FAFAFA', // Almost White (Sand)
          'surface-variant': '#E8F5E9', // Light Green Tint
          background: '#E0F7FA', // Light Cyan Background (Sky/Water)
          'on-background': '#004D73', // Deep Ocean Text
          'on-surface': '#00796B', // Teal Text
          'on-surface-variant': '#40796B',
          'on-primary': '#FFFFFF',
          'on-secondary': '#000000',
          'on-error': '#FFFFFF',
        },
      },
      dark: {
        dark: true,
        colors: {
          // Hacker/Programmer Theme - Dark Mode
          primary: '#00FF41', // Matrix Green (Neon)
          'primary-darken-1': '#00E63D',
          secondary: '#FF2D95', // Neon Pink/Magenta
          'secondary-darken-1': '#E81B7E',
          tertiary: '#00FFFF', // Cyan Neon
          error: '#FF0055', // Neon Red
          info: '#0088FF', // Neon Blue
          success: '#00FF41', // Matrix Green
          warning: '#FF6B00', // Neon Orange
          // Background colors for dark theme
          background: '#0A0E27', // Deep Navy/Black
          surface: '#0F1419', // Terminal Surface (Darker)
          'surface-variant': '#1a1f3a', // Dark Purple-ish variant
          'on-background': '#00FF41', // Matrix Green Text
          'on-surface': '#00FF41', // Matrix Green Text
          'on-surface-variant': '#FF2D95', // Neon Pink variant text
          'on-primary': '#000000', // Black on neon
          'on-secondary': '#000000', // Black on neon
          'on-error': '#000000', // Black on neon
        },
      },
    },
  },
});

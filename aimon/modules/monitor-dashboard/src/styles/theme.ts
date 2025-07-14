export const lightTheme = {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#f5f5f5',
    surface: '#ffffff',
    sidebar: '#ffffff',
    text: '#2c3e50',
    textSecondary: '#7f8c8d',
    border: '#e0e0e0',
    hover: '#f0f0f0',
    activeBg: '#e3f2fd',
    success: '#2ecc71',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
  },
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.1)',
    medium: '0 4px 8px rgba(0,0,0,0.1)',
    large: '0 8px 16px rgba(0,0,0,0.1)',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
};

export const darkTheme = {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#1a1a1a',
    surface: '#2c2c2c',
    sidebar: '#242424',
    text: '#ecf0f1',
    textSecondary: '#95a5a6',
    border: '#404040',
    hover: '#363636',
    activeBg: '#1e3a5f',
    success: '#27ae60',
    warning: '#e67e22',
    error: '#c0392b',
    info: '#2980b9',
  },
  shadows: {
    small: '0 2px 4px rgba(0,0,0,0.3)',
    medium: '0 4px 8px rgba(0,0,0,0.3)',
    large: '0 8px 16px rgba(0,0,0,0.3)',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
};

export type Theme = typeof lightTheme;
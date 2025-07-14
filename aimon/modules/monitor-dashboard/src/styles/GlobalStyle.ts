import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    transition: background-color ${({ theme }) => theme.transitions.normal};
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }

  /* Global heading styles */
  h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 24px;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 12px;
  }

  /* Global link styles */
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};

    &:hover {
      text-decoration: underline;
    }
  }

  /* Button base styles */
  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
    transition: all ${({ theme }) => theme.transitions.fast};

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  /* Input base styles */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    transition: all ${({ theme }) => theme.transitions.fast};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;
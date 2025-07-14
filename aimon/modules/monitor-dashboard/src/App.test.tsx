import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import App from './App';
import { store } from './store';
import { lightTheme } from './styles/theme';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={lightTheme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />);
  });

  test('renders sidebar navigation', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('AI Activity Monitor')).toBeInTheDocument();
  });

  test('renders main content area', () => {
    renderWithProviders(<App />);
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
  });
});
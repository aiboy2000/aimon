import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

// Layout components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

// Pages
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Sessions from './pages/Sessions';
import Applications from './pages/Applications';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Store
import { AppDispatch } from './store';
import { fetchSettings } from './store/slices/settingsSlice';
import { connectToActivityDB } from './store/slices/activitySlice';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Load settings and connect to activity database
    dispatch(fetchSettings());
    dispatch(connectToActivityDB());

    // Listen for navigation from Electron
    if (window.electronAPI) {
      window.electronAPI.onNavigate((route: string) => {
        window.location.hash = route;
      });
    }
  }, [dispatch]);

  return (
    <AppContainer>
      <Sidebar />
      <MainContent>
        <Header />
        <Content>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </MainContent>
    </AppContainer>
  );
};

export default App;
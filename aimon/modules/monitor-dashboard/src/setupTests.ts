// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';

// Mock electron API for tests
global.electronAPI = {
  getSettings: jest.fn().mockResolvedValue({
    apiUrl: 'http://localhost:8080',
    apiKey: 'test-key',
    refreshInterval: 5000,
    theme: 'light',
    notifications: true,
  }),
  saveSettings: jest.fn().mockResolvedValue({ success: true }),
  getAppVersion: jest.fn().mockResolvedValue('0.1.0'),
  onNavigate: jest.fn(),
  minimizeWindow: jest.fn(),
  maximizeWindow: jest.fn(),
  closeWindow: jest.fn(),
};
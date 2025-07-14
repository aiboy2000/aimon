import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Settings } from '@/types';

interface SettingsState extends Settings {
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  apiUrl: 'http://localhost:8080',
  apiKey: '',
  refreshInterval: 5000,
  theme: 'light',
  notifications: true,
  loading: false,
  error: null,
};

// Async thunks
export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async () => {
    if (window.electronAPI) {
      return await window.electronAPI.getSettings();
    }
    // Fallback for web version
    const stored = localStorage.getItem('settings');
    return stored ? JSON.parse(stored) : initialState;
  }
);

export const saveSettings = createAsyncThunk(
  'settings/save',
  async (settings: Settings) => {
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(settings);
    } else {
      // Fallback for web version
      localStorage.setItem('settings', JSON.stringify(settings));
    }
    return settings;
  }
);

// Slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<Settings>>) => {
      Object.assign(state, action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        Object.assign(state, action.payload);
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      // Save settings
      .addCase(saveSettings.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
      });
  },
});

export const { updateSettings, toggleTheme } = settingsSlice.actions;
export default settingsSlice.reducer;
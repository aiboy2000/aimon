import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DashboardStats } from '@/types';
import { apiClient } from '@/services/api';

interface DashboardState {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  stats: {
    totalEvents: 0,
    activeTime: 0,
    keystrokes: 0,
    mouseClicks: 0,
    applications: 0,
    productivityScore: 0,
  },
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async () => {
    // In a real implementation, this would fetch aggregated stats from the API
    const response = await apiClient.get('/events/statistics/');
    
    // Transform the response to match our DashboardStats interface
    return {
      totalEvents: response.data.total_events || 0,
      activeTime: response.data.active_time_seconds || 0,
      keystrokes: response.data.events_by_type?.KeyPress || 0,
      mouseClicks: response.data.events_by_type?.MouseClick || 0,
      applications: response.data.unique_applications || 0,
      productivityScore: response.data.productivity_score || 0.75,
    };
  }
);

// Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch dashboard stats';
      });
  },
});

export const { updateStats } = dashboardSlice.actions;
export default dashboardSlice.reducer;
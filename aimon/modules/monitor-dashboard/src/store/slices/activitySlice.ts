import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { InputEvent, ListResponse } from '@/types';
import { apiClient } from '@/services/api';

interface ActivityState {
  events: InputEvent[];
  totalEvents: number;
  loading: boolean;
  error: string | null;
  filters: {
    startDate?: string;
    endDate?: string;
    eventType?: string;
    sessionId?: string;
    deviceId?: string;
  };
  pagination: {
    skip: number;
    limit: number;
  };
}

const initialState: ActivityState = {
  events: [],
  totalEvents: 0,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    skip: 0,
    limit: 50,
  },
};

// Async thunks
export const fetchEvents = createAsyncThunk(
  'activity/fetchEvents',
  async (_, { getState }) => {
    const state = getState() as any;
    const { filters, pagination } = state.activity;
    
    const response = await apiClient.get<ListResponse<InputEvent>>('/events/', {
      params: {
        ...filters,
        ...pagination,
      },
    });
    
    return response.data;
  }
);

export const connectToActivityDB = createAsyncThunk(
  'activity/connect',
  async () => {
    // This could establish WebSocket connection for real-time updates
    return { connected: true };
  }
);

// Slice
const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ActivityState['filters']>) => {
      state.filters = action.payload;
      state.pagination.skip = 0; // Reset pagination when filters change
    },
    setPagination: (state, action: PayloadAction<Partial<ActivityState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addEvent: (state, action: PayloadAction<InputEvent>) => {
      state.events.unshift(action.payload);
      state.totalEvents += 1;
      
      // Keep only the latest events in memory
      if (state.events.length > 100) {
        state.events = state.events.slice(0, 100);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.items;
        state.totalEvents = action.payload.total;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch events';
      });
  },
});

export const { setFilters, setPagination, addEvent } = activitySlice.actions;
export default activitySlice.reducer;
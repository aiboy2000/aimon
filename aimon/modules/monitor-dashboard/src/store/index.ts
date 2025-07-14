import { configureStore } from '@reduxjs/toolkit';
import activityReducer from './slices/activitySlice';
import sessionsReducer from './slices/sessionsSlice';
import applicationsReducer from './slices/applicationsSlice';
import settingsReducer from './slices/settingsSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    activity: activityReducer,
    sessions: sessionsReducer,
    applications: applicationsReducer,
    settings: settingsReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
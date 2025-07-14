import { createSlice } from '@reduxjs/toolkit';

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState: {
    sessions: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default sessionsSlice.reducer;
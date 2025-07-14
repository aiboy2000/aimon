import { createSlice } from '@reduxjs/toolkit';

const applicationsSlice = createSlice({
  name: 'applications',
  initialState: {
    applications: [],
    loading: false,
    error: null,
  },
  reducers: {},
});

export default applicationsSlice.reducer;
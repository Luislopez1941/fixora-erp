import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const servicesSlice = createSlice({
  name: 'services',
  initialState: {
    services: [],
    servicesUpdate: null,
  },
  reducers: {
    updateServices: (state, action: PayloadAction<any | 'reset'>) => {
      if (action.payload === 'reset') {
        state.servicesUpdate = null;
        return;
      }
      state.servicesUpdate = action.payload;
    },
    setServices: (state, action: PayloadAction<any>) => {
      state.services = action.payload;
    },
  },
});

export const { updateServices, setServices } = servicesSlice.actions;

export default servicesSlice.reducer;

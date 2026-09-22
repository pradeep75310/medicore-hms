import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  role: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.role = action.payload.role;
      state.token = action.payload.token || 'demo-token';
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
      state.token = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

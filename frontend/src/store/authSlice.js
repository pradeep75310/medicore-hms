import { createSlice } from "@reduxjs/toolkit";

import {
  getToken,
  getStoredUser,
  getStoredRole,
  setAuthSession,
  clearAuthSession,
} from "../api/client";

const initialToken = getToken();
const initialUser = getStoredUser();
const initialRole = getStoredRole() || initialUser?.role || null;

const initialState = {
  user: initialUser,
  isAuthenticated: !!initialToken,
  role: initialRole,
  token: initialToken,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    login: (state, action) => {
      const { user, role, token, refresh } = action.payload;

      state.user = user;
      state.isAuthenticated = !!token;
      state.role = role || user?.role || null;
      state.token = token || null;

      if (token) {
        setAuthSession(token, refresh, user);
      }
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
      state.token = null;

      clearAuthSession();
    },

    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };

      if (state.token) {
        setAuthSession(state.token, null, state.user);
      }
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;

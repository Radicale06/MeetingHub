import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  email: string;
  roleId: number;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  jobTitle?: string;
  company?: string;
  timezone?: string;
  language?: string;
}

export interface AuthState {
  auth: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  } | null;
}

const initialState: AuthState = {
  auth: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<AuthState["auth"]>) => {
      state.auth = action.payload;
    },
    logout: (state) => {
      state.auth = null;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.auth) {
        state.auth.user = { ...state.auth.user, ...action.payload };
      }
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;

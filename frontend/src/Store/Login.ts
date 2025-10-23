import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface LoginState {
  isLoggedIn: boolean;
  userName: string | null;
  userEmail: string | null;
}

const initialState: LoginState = {
  isLoggedIn: false,
  userName: null,
  userEmail: null,
};

export const loginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ name: string; email: string }>) => {
      state.isLoggedIn = true;
      state.userName = action.payload.name;
      state.userEmail = action.payload.email;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.userName = null;
      state.userEmail = null;
    },
  },
});

export const { login, logout } = loginSlice.actions;
export default loginSlice.reducer;

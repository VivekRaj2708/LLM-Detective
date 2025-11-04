import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  id: string | null;
  name: string;
  email: string;
  storage: number;
  projects: string[];
}

const initialState: UserState = {
  id: null,
  name: "",
  email: "",
  storage: 0,
  projects: [],
};

export const userSlice = createSlice({
  name: "user",
  initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserState>) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.storage = action.payload.storage;
            state.projects = action.payload.projects;
        },
        clearUser: (state) => {
            state.id = null;
            state.name = "";
            state.email = "";
            state.storage = 0;
            state.projects = [];
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;


import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ProjectModel {
  id: string;
  name: string;
  status: string; // default "active"
  documents: string[]; // array of document IDs
}

interface ProjectState {
  projects: ProjectModel[];
}

const initialState: ProjectState = {
  projects: [],
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // ✅ Replace all projects
    setProjects(state, action: PayloadAction<ProjectModel[]>) {
      state.projects = action.payload;
    },

    // ✅ Clear all projects
    clearProjects(state) {
      state.projects = [];
    },
  },
});

export const { setProjects, clearProjects } = projectSlice.actions;
export default projectSlice.reducer;

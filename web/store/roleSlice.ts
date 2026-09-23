import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getStoredRole,
  ROLE_STORAGE_KEY,
  type DemoRole,
} from "@/lib/auth";

interface RoleState {
  role: DemoRole;
}

const initialState: RoleState = {
  role: "ADMIN",
};

const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    hydrateRole(state) {
      state.role = getStoredRole();
    },
    setRole(state, action: PayloadAction<DemoRole>) {
      state.role = action.payload;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ROLE_STORAGE_KEY, action.payload);
      }
    },
  },
});

export const { hydrateRole, setRole } = roleSlice.actions;
export default roleSlice.reducer;

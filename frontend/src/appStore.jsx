import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      dopen: false, // Initial state
      updateDopen: (dopen) => set({ dopen }), // Update function
    }),
    {
      name: "my_app_store", // Local storage key
    }
  )
);

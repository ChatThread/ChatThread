import { create } from "zustand";
import { GlobalVariablesStore } from "../../types/zustand/global-variables";

export const useGlobalVariablesStore = create<GlobalVariablesStore>(
  (set, get) => ({
    unavailableFields: {},
    setUnavailableFields: (fields) => {
      set({ unavailableFields: fields });
    },
    globalVariablesEntries: undefined,
    setGlobalVariablesEntries: (entries) => {
      set({ globalVariablesEntries: entries });
    },
  }),
);

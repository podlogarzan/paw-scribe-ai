import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  activePetId: string | null;
  setActivePetId: (id: string | null) => void;
};

export const useActivePet = create<State>()(
  persist(
    (set) => ({
      activePetId: null,
      setActivePetId: (id) => set({ activePetId: id }),
    }),
    { name: "petvet:active-pet" },
  ),
);
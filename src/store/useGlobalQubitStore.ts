import { create } from 'zustand';

interface QubitState {
  globalQubits: number;
  setGlobalQubits: (count: number) => void;
}

export const useGlobalQubitStore = create<QubitState>((set) => ({
  globalQubits: 8,
  setGlobalQubits: (count) => set({ globalQubits: count < 1 ? 1 : count }),
}));

import { create } from "zustand";

interface FunctionsState {
  functions: string[];
  activeFunction: string;
  isLoading: boolean;
  setFunctions: (functions: string[]) => void;
  setActiveFunction: (functionName: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useFunctionsStore = create<FunctionsState>((set) => {
  const initialFunctions = ["abcd", "efgh"];
  return {
    functions: initialFunctions,
    activeFunction: initialFunctions[0],
    isLoading: false,
    setFunctions: (functions) => set({ functions }),
    setActiveFunction: (functionName) => set({ activeFunction: functionName }),
    setIsLoading: (isLoading) => set({ isLoading }),
  };
});

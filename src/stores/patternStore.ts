import { create } from "zustand";
import type { PatternData } from "@/types/firebase";
import type { Expression } from "@/types/expression";
import type { DeviceType } from "@/types/device";
import type { QueryDocumentSnapshot } from "firebase/firestore";

interface PatternState {
  patterns: PatternData[];
  loading: boolean;
  sortBy: "latest" | "popular" | "downloads";
  filterExpression: Expression | null;
  filterDevice: DeviceType | null;
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
  setPatterns: (patterns: PatternData[]) => void;
  appendPatterns: (patterns: PatternData[], lastDoc: QueryDocumentSnapshot | null) => void;
  setSortBy: (sortBy: "latest" | "popular" | "downloads") => void;
  setFilterExpression: (expression: Expression | null) => void;
  setFilterDevice: (device: DeviceType | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  patterns: [] as PatternData[],
  loading: false,
  sortBy: "latest" as const,
  filterExpression: null as Expression | null,
  filterDevice: null as DeviceType | null,
  lastDoc: null as QueryDocumentSnapshot | null,
  hasMore: true,
};

export const usePatternStore = create<PatternState>()((set) => ({
  ...initialState,
  setPatterns: (patterns) => set({ patterns }),
  appendPatterns: (patterns, lastDoc) =>
    set((state) => ({
      patterns: [...state.patterns, ...patterns],
      lastDoc,
      hasMore: patterns.length > 0,
    })),
  setSortBy: (sortBy) => set({ sortBy, patterns: [], lastDoc: null, hasMore: true }),
  setFilterExpression: (filterExpression) =>
    set({ filterExpression, patterns: [], lastDoc: null, hasMore: true }),
  setFilterDevice: (filterDevice) =>
    set({ filterDevice, patterns: [], lastDoc: null, hasMore: true }),
  setLoading: (loading) => set({ loading }),
  reset: () => set(initialState),
}));

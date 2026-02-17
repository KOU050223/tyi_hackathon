import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Expression } from "@/types/expression";
import type { DeviceType } from "@/types/device";

function createEmptyGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0) as number[]);
}

function resizeGrid(oldGrid: number[][], newRows: number, newCols: number): number[][] {
  const newGrid = createEmptyGrid(newRows, newCols);
  const copyRows = Math.min(oldGrid.length, newRows);
  const copyCols = Math.min(oldGrid[0]?.length ?? 0, newCols);
  for (let r = 0; r < copyRows; r++) {
    for (let c = 0; c < copyCols; c++) {
      newGrid[r][c] = oldGrid[r][c];
    }
  }
  return newGrid;
}

const DEFAULT_ROWS = 26;
const DEFAULT_COLS = 21;

interface EditorState {
  gridData: number[][];
  color: string;
  name: string;
  expressionType: Expression;
  deviceType: DeviceType;
  isPublic: boolean;
  tags: string[];
  tool: "draw" | "erase";
  isDrawing: boolean;
  rows: number;
  cols: number;

  setCell: (row: number, col: number, value: number) => void;
  toggleCell: (row: number, col: number) => void;
  setColor: (color: string) => void;
  setName: (name: string) => void;
  setExpressionType: (type: Expression) => void;
  setDeviceType: (type: DeviceType) => void;
  setTool: (tool: "draw" | "erase") => void;
  setIsDrawing: (drawing: boolean) => void;
  setGridSize: (rows: number, cols: number) => void;
  clearGrid: () => void;
  setIsPublic: (isPublic: boolean) => void;
  setTags: (tags: string[]) => void;
  loadPattern: (pattern: {
    gridData: number[][];
    color: string;
    name: string;
    expressionType: Expression;
    deviceType: DeviceType;
    isPublic: boolean;
    tags: string[];
  }) => void;
  resetEditor: () => void;
}

const initialState = {
  gridData: createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS),
  color: "#E66CBC",
  name: "",
  expressionType: "neutral" as Expression,
  deviceType: "smartphone" as DeviceType,
  isPublic: true,
  tags: [] as string[],
  tool: "draw" as const,
  isDrawing: false,
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      ...initialState,

      setCell: (row, col, value) =>
        set((state) => {
          const newGrid = state.gridData.map((r) => [...r]);
          if (newGrid[row]?.[col] !== undefined) {
            newGrid[row][col] = value;
          }
          return { gridData: newGrid };
        }),

      toggleCell: (row, col) =>
        set((state) => {
          const newGrid = state.gridData.map((r) => [...r]);
          if (newGrid[row]?.[col] !== undefined) {
            newGrid[row][col] = newGrid[row][col] === 1 ? 0 : 1;
          }
          return { gridData: newGrid };
        }),

      setColor: (color) => set({ color }),

      setName: (name) => set({ name }),

      setExpressionType: (expressionType) => set({ expressionType }),

      setDeviceType: (deviceType) => set({ deviceType }),

      setTool: (tool) => set({ tool }),

      setIsDrawing: (isDrawing) => set({ isDrawing }),

      setGridSize: (rows, cols) =>
        set((state) => ({
          rows,
          cols,
          gridData: resizeGrid(state.gridData, rows, cols),
        })),

      clearGrid: () =>
        set((state) => ({
          gridData: createEmptyGrid(state.rows, state.cols),
        })),

      setIsPublic: (isPublic) => set({ isPublic }),

      setTags: (tags) => set({ tags }),

      loadPattern: (pattern) =>
        set({
          gridData: pattern.gridData,
          color: pattern.color,
          name: pattern.name,
          expressionType: pattern.expressionType,
          deviceType: pattern.deviceType,
          isPublic: pattern.isPublic,
          tags: pattern.tags,
          rows: pattern.gridData.length,
          cols: pattern.gridData[0]?.length ?? DEFAULT_COLS,
        }),

      resetEditor: () =>
        set({
          ...initialState,
          gridData: createEmptyGrid(DEFAULT_ROWS, DEFAULT_COLS),
        }),
    }),
    {
      name: "editor-draft",
      partialize: (state) => ({
        gridData: state.gridData,
        color: state.color,
        name: state.name,
        expressionType: state.expressionType,
        deviceType: state.deviceType,
        isPublic: state.isPublic,
        tags: state.tags,
        rows: state.rows,
        cols: state.cols,
      }),
    },
  ),
);

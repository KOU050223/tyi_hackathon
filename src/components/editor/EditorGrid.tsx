import { useCallback, useEffect } from "react";
import { useEditorStore } from "@/stores/editorStore";

export function EditorGrid() {
  const gridData = useEditorStore((s) => s.gridData);
  const color = useEditorStore((s) => s.color);
  const tool = useEditorStore((s) => s.tool);
  const isDrawing = useEditorStore((s) => s.isDrawing);
  const rows = useEditorStore((s) => s.rows);
  const cols = useEditorStore((s) => s.cols);
  const setCell = useEditorStore((s) => s.setCell);
  const setIsDrawing = useEditorStore((s) => s.setIsDrawing);

  const handleCellAction = useCallback(
    (row: number, col: number) => {
      const value = tool === "draw" ? 1 : 0;
      setCell(row, col, value);
    },
    [tool, setCell],
  );

  const handleMouseDown = useCallback(
    (row: number, col: number) => {
      setIsDrawing(true);
      handleCellAction(row, col);
    },
    [setIsDrawing, handleCellAction],
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (isDrawing) {
        handleCellAction(row, col);
      }
    },
    [isDrawing, handleCellAction],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (
        target instanceof HTMLElement &&
        target.dataset.row &&
        target.dataset.col
      ) {
        const row = parseInt(target.dataset.row, 10);
        const col = parseInt(target.dataset.col, 10);
        handleCellAction(row, col);
      }
    },
    [handleCellAction],
  );

  useEffect(() => {
    const handleMouseUp = () => setIsDrawing(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [setIsDrawing]);

  const cellSize = Math.min(30, Math.floor((window.innerWidth - 40) / cols));

  return (
    <div
      className="select-none touch-none"
      onTouchMove={handleTouchMove}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: "1px",
      }}
    >
      {gridData.map((row, rowIdx) =>
        row.map((cell, colIdx) => (
          <div
            key={`${rowIdx}-${colIdx}`}
            data-row={rowIdx}
            data-col={colIdx}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMouseDown(rowIdx, colIdx);
            }}
            onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
            onTouchStart={(e) => {
              e.preventDefault();
              setIsDrawing(true);
              handleCellAction(rowIdx, colIdx);
            }}
            className="cursor-pointer transition-colors duration-75"
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: cell === 1 ? color : "#231834",
              border: "1px solid #3D2A55",
              boxSizing: "border-box",
            }}
          />
        )),
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { GUIDE_CONFIG } from "@/constants/grid";

function getCellGuideStyle(
  rowIdx: number,
  colIdx: number,
  showGuides: boolean,
  rows: number,
  cols: number,
): React.CSSProperties {
  if (!showGuides || rows !== GUIDE_CONFIG.standardRows || cols !== GUIDE_CONFIG.standardCols) {
    return {};
  }

  const { leftEye, rightEye, mouth, eyeOnlyBoundary } = GUIDE_CONFIG;

  const inLeftEye =
    rowIdx >= leftEye.rowStart &&
    rowIdx <= leftEye.rowEnd &&
    colIdx >= leftEye.colStart &&
    colIdx <= leftEye.colEnd;

  const inRightEye =
    rowIdx >= rightEye.rowStart &&
    rowIdx <= rightEye.rowEnd &&
    colIdx >= rightEye.colStart &&
    colIdx <= rightEye.colEnd;

  const inMouth =
    rowIdx >= mouth.rowStart &&
    rowIdx <= mouth.rowEnd &&
    colIdx >= mouth.colStart &&
    colIdx <= mouth.colEnd;

  const isEyeBoundaryBottom = rowIdx === eyeOnlyBoundary;

  const shadows: string[] = [];

  if (inLeftEye || inRightEye) {
    shadows.push("inset 0 0 0 1px rgba(100, 200, 255, 0.5)");
  }
  if (inMouth) {
    shadows.push("inset 0 0 0 1px rgba(255, 120, 180, 0.5)");
  }
  if (isEyeBoundaryBottom) {
    shadows.push("inset 0 -2px 0 0 rgba(255, 215, 0, 0.7)");
  }

  if (shadows.length === 0) return {};

  return { boxShadow: shadows.join(", ") };
}

export function EditorGrid() {
  const gridData = useEditorStore((s) => s.gridData);
  const color = useEditorStore((s) => s.color);
  const tool = useEditorStore((s) => s.tool);
  const isDrawing = useEditorStore((s) => s.isDrawing);
  const rows = useEditorStore((s) => s.rows);
  const cols = useEditorStore((s) => s.cols);
  const setCell = useEditorStore((s) => s.setCell);
  const setIsDrawing = useEditorStore((s) => s.setIsDrawing);
  const [showGuides, setShowGuides] = useState(true);

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
      if (target instanceof HTMLElement && target.dataset.row && target.dataset.col) {
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
  const isStandardGrid = rows === GUIDE_CONFIG.standardRows && cols === GUIDE_CONFIG.standardCols;

  return (
    <div className="flex flex-col items-center gap-2">
      {isStandardGrid && (
        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            onClick={() => setShowGuides((v) => !v)}
            className={`px-2 py-1 border transition-colors ${
              showGuides
                ? "border-[#E66CBC]/60 text-[#E66CBC] bg-[#E66CBC]/10"
                : "border-[#3D2A55] text-[#7B6B96] hover:border-[#E66CBC]/40"
            }`}
          >
            補助線 {showGuides ? "ON" : "OFF"}
          </button>
          {showGuides && (
            <span className="flex gap-2 text-[10px]">
              <span className="text-[#64C8FF]">■ 目</span>
              <span className="text-[#FF78B4]">■ 口</span>
              <span className="text-[#FFD700]">— スマホ境界</span>
            </span>
          )}
        </div>
      )}
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
                ...getCellGuideStyle(rowIdx, colIdx, showGuides, rows, cols),
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}

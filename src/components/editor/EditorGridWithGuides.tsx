import { useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { GUIDE_CONFIG } from "@/types/face";

interface EditorGridWithGuidesProps {
  showCenterLineH?: boolean;
  showCenterLineV?: boolean;
  showEyeOnlyLine?: boolean;
  eyeOnlyRows?: number;
  showEyeMouthGuide?: boolean;
}

export function EditorGridWithGuides({
  showCenterLineH = false,
  showCenterLineV = false,
  showEyeOnlyLine = false,
  eyeOnlyRows = 14,
  showEyeMouthGuide = false,
}: EditorGridWithGuidesProps) {
  const gridData = useEditorStore((s) => s.gridData);
  const color = useEditorStore((s) => s.color);
  const rows = useEditorStore((s) => s.rows);
  const cols = useEditorStore((s) => s.cols);
  const setCell = useEditorStore((s) => s.setCell);

  // クリックしたセルだけをトグル（ドラッグ連続塗りなし）
  const handleClick = useCallback(
    (row: number, col: number) => {
      const currentVal = gridData[row]?.[col] ?? 0;
      setCell(row, col, currentVal === 1 ? 0 : 1);
    },
    [gridData, setCell],
  );

  const cellSize = Math.min(30, Math.floor((window.innerWidth - 40) / cols));
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);

  const getCellBoxShadow = (rowIdx: number, colIdx: number): string | undefined => {
    const parts: string[] = [];

    if (showCenterLineH && rowIdx === centerRow) {
      parts.push("inset 0 2px 0 0 #FFD700, inset 0 -2px 0 0 #FFD700");
    }
    if (showCenterLineV && colIdx === centerCol) {
      parts.push("inset 2px 0 0 0 #FFD700, inset -2px 0 0 0 #FFD700");
    }
    if (showEyeOnlyLine && rowIdx === eyeOnlyRows - 1) {
      parts.push("inset 0 -3px 0 0 #00BFFF");
    }

    if (
      showEyeMouthGuide &&
      rows === GUIDE_CONFIG.standardRows &&
      cols === GUIDE_CONFIG.standardCols
    ) {
      const { leftEye, rightEye, mouth } = GUIDE_CONFIG;
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

      if (inLeftEye || inRightEye) {
        parts.push("inset 0 0 0 1px rgba(100, 200, 255, 0.6)");
      }
      if (inMouth) {
        parts.push("inset 0 0 0 1px rgba(255, 120, 180, 0.6)");
      }
    }

    return parts.length > 0 ? parts.join(", ") : undefined;
  };

  return (
    <div
      className="select-none"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: "0px",
      }}
    >
      {gridData.map((row, rowIdx) =>
        row.map((cell, colIdx) => (
          <div
            key={`${rowIdx}-${colIdx}`}
            onClick={() => handleClick(rowIdx, colIdx)}
            className="cursor-pointer transition-colors duration-75"
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: cell === 1 ? color : "#231834",
              border: "1px solid #3D2A55",
              boxShadow: getCellBoxShadow(rowIdx, colIdx),
              boxSizing: "border-box",
            }}
          />
        )),
      )}
    </div>
  );
}

import { useCallback } from "react";
import { useEditorStore } from "@/stores/editorStore";

interface EditorGridWithGuidesProps {
  showCenterLineH?: boolean;
  showCenterLineV?: boolean;
  showEyeOnlyLine?: boolean;
  eyeOnlyRows?: number;
}

export function EditorGridWithGuides({
  showCenterLineH = false,
  showCenterLineV = false,
  showEyeOnlyLine = false,
  eyeOnlyRows = 14,
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

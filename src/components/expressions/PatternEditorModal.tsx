import { useEffect, useState, useRef } from "react";
import type { Expression } from "@/types/expression";
import type { PatternJson } from "@/lib/localPatterns";
import { loadPatternJson, validatePatternJson } from "@/lib/localPatterns";
import { useEditorStore } from "@/stores/editorStore";
import { EditorGrid } from "@/components/editor/EditorGrid";

interface PatternEditorModalProps {
  expression: Expression | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "visual" | "json" | "preview";

export function PatternEditorModal({
  expression,
  isOpen,
  onClose,
}: PatternEditorModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("visual");
  const [patternData, setPatternData] = useState<PatternJson | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    loadPattern,
    resetEditor,
    gridData,
    color,
    setColor,
    rows,
    cols,
  } = useEditorStore();

  // モーダルの開閉制御
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      // ESCキーでのクローズを無効化（明示的なボタンでのみ閉じる）
      dialog.addEventListener("cancel", handleCancel);
    } else {
      dialog.close();
    }

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [isOpen]);

  const handleCancel = (e: Event) => {
    e.preventDefault();
    handleClose();
  };

  // パターンデータの読み込み
  useEffect(() => {
    if (!expression || !isOpen) return;

    setIsLoading(true);
    loadPatternJson(expression)
      .then((data) => {
        setPatternData(data);
        setJsonText(JSON.stringify(data, null, 2));

        // editorStoreにロード
        loadPattern({
          gridData: data.grid,
          color: data.color,
          name: data.expression,
          expressionType: expression,
          deviceType: "smartphone",
          isPublic: true,
          tags: [],
        });
      })
      .catch((error) => {
        console.error("Failed to load pattern:", error);
        setJsonError([`パターンの読み込みに失敗しました: ${error.message}`]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [expression, isOpen, loadPattern]);

  // プレビュー描画
  useEffect(() => {
    if (activeTab !== "preview" || !previewCanvasRef.current || !patternData) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grid = gridData;
    const dotSize = 20;
    const canvasWidth = cols * dotSize;
    const canvasHeight = rows * dotSize;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 背景を暗い色で塗りつぶす
    ctx.fillStyle = "#231834";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // ドット絵を描画
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 1) {
          ctx.fillStyle = color;
          ctx.fillRect(c * dotSize, r * dotSize, dotSize, dotSize);
        }
      }
    }
  }, [activeTab, gridData, color, rows, cols, patternData]);

  const handleClose = () => {
    resetEditor();
    setPatternData(null);
    setJsonText("");
    setJsonError([]);
    setActiveTab("visual");
    onClose();
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    setJsonError([]);

    try {
      const parsed = JSON.parse(text);
      const validation = validatePatternJson(parsed);

      if (validation.valid) {
        const data = parsed as PatternJson;
        setPatternData(data);

        // editorStoreを更新
        loadPattern({
          gridData: data.grid,
          color: data.color,
          name: data.expression,
          expressionType: expression || "neutral",
          deviceType: "smartphone",
          isPublic: true,
          tags: [],
        });
      } else {
        setJsonError(validation.errors);
      }
    } catch (error) {
      if (error instanceof Error) {
        setJsonError([`JSON解析エラー: ${error.message}`]);
      }
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (patternData) {
      const updated = { ...patternData, color: newColor };
      setPatternData(updated);
      setJsonText(JSON.stringify(updated, null, 2));
    }
  };

  const handleDownload = () => {
    if (!patternData || !expression) return;

    // 最新のgridDataとcolorでPatternJsonを更新
    const downloadData: PatternJson = {
      ...patternData,
      grid: gridData,
      color: color,
      size: {
        width: cols,
        height: rows,
      },
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${expression}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // editorStoreのgridDataが変わったらJSONも更新
  useEffect(() => {
    if (patternData && activeTab === "visual") {
      const updated: PatternJson = {
        ...patternData,
        grid: gridData,
        color: color,
        size: {
          width: cols,
          height: rows,
        },
      };
      setPatternData(updated);
      setJsonText(JSON.stringify(updated, null, 2));
    }
  }, [gridData, color, rows, cols]);

  if (!expression) return null;

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg bg-[#231834] text-white p-0 backdrop:bg-black/80 max-w-4xl w-full"
      style={{ border: "2px solid #E66CBC" }}
    >
      <div className="flex flex-col h-[90vh]">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-[#E66CBC]/30">
          <h2 className="text-xl font-bold">
            パターン編集: {expression}
          </h2>
          <button
            onClick={handleClose}
            className="text-2xl hover:text-[#E66CBC] transition-colors"
          >
            ×
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-[#E66CBC]/30">
          <button
            onClick={() => setActiveTab("visual")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "visual"
                ? "bg-[#E66CBC] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ビジュアルエディタ
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "json"
                ? "bg-[#E66CBC] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            JSONビュー
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "preview"
                ? "bg-[#E66CBC] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            プレビュー
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading && (
            <div className="text-center">読み込み中...</div>
          )}

          {!isLoading && activeTab === "visual" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">カラー:</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-20 h-10 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-400">{color}</span>
              </div>
              <div className="flex justify-center">
                <EditorGrid />
              </div>
            </div>
          )}

          {!isLoading && activeTab === "json" && (
            <div className="space-y-4">
              {jsonError.length > 0 && (
                <div className="bg-red-900/30 border border-red-500 rounded p-3">
                  <div className="font-bold mb-1">エラー:</div>
                  <ul className="list-disc list-inside text-sm">
                    {jsonError.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-[500px] bg-[#1a1324] text-white font-mono text-sm p-4 rounded border border-[#E66CBC]/30 focus:border-[#E66CBC] outline-none"
                spellCheck={false}
              />
            </div>
          )}

          {!isLoading && activeTab === "preview" && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm text-gray-400">
                現在の編集結果のプレビュー
              </div>
              <canvas
                ref={previewCanvasRef}
                className="border border-[#E66CBC]/30 rounded"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 p-4 border-t border-[#E66CBC]/30">
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleDownload}
            disabled={jsonError.length > 0}
            className="px-6 py-2 rounded bg-[#E66CBC] hover:bg-[#d55bab] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            JSONをダウンロード
          </button>
        </div>
      </div>
    </dialog>
  );
}

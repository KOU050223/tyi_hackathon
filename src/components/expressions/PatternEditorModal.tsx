import { useEffect, useState, useRef } from "react";
import type { Expression } from "@/types/expression";
import type { PatternJson } from "@/lib/localPatterns";
import { loadPatternJson } from "@/lib/localPatterns";
import { useEditorStore } from "@/stores/editorStore";
import { EditorGridWithGuides } from "@/components/editor/EditorGridWithGuides";
import { clearPatternCache } from "@/utils/dotPatterns";

interface PatternEditorModalProps {
  expression: Expression | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "visual" | "preview";

export function PatternEditorModal({ expression, isOpen, onClose }: PatternEditorModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("visual");
  const [patternData, setPatternData] = useState<PatternJson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [showCenterLineH, setShowCenterLineH] = useState(false);
  const [showCenterLineV, setShowCenterLineV] = useState(false);
  const [showEyeOnlyLine, setShowEyeOnlyLine] = useState(false);
  const [showEyeMouthGuide, setShowEyeMouthGuide] = useState(true);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const { loadPattern, resetEditor, gridData, color, setColor, rows, cols } = useEditorStore();

  // ESCキーで閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // パターンデータの読み込み
  useEffect(() => {
    if (!expression || !isOpen) return;

    setIsLoading(true);

    const savedJson = localStorage.getItem(`localPattern:${expression}`);
    let loadPromise: Promise<PatternJson>;
    if (savedJson) {
      try {
        loadPromise = Promise.resolve(JSON.parse(savedJson) as PatternJson);
      } catch (e) {
        console.warn(
          `localPattern:${expression} のJSONが壊れています。デフォルトパターンを読み込みます。`,
          e,
        );
        localStorage.removeItem(`localPattern:${expression}`);
        loadPromise = loadPatternJson(expression);
      }
    } else {
      loadPromise = loadPatternJson(expression);
    }

    loadPromise
      .then((data) => {
        setPatternData(data);
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
      .catch((error: unknown) => {
        console.error("Failed to load pattern:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [expression, isOpen, loadPattern]);

  // プレビュー描画
  useEffect(() => {
    if (activeTab !== "preview" || !previewCanvasRef.current || !patternData) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dotSize = 20;
    canvas.width = cols * dotSize;
    canvas.height = rows * dotSize;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#231834";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < gridData.length; r++) {
      for (let c = 0; c < gridData[r].length; c++) {
        if (gridData[r][c] === 1) {
          ctx.fillStyle = color;
          ctx.fillRect(c * dotSize, r * dotSize, dotSize, dotSize);
        }
      }
    }
  }, [activeTab, gridData, color, rows, cols, patternData]);

  const handleClose = () => {
    resetEditor();
    setPatternData(null);
    setSavedMessage(false);
    setActiveTab("visual");
    onClose();
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (patternData) {
      setPatternData({ ...patternData, color: newColor });
    }
  };

  const handleSave = () => {
    if (!patternData || !expression) return;

    const saveData: PatternJson = {
      ...patternData,
      grid: gridData,
      color,
      size: { width: cols, height: rows },
    };

    localStorage.setItem(`localPattern:${expression}`, JSON.stringify(saveData));
    clearPatternCache();

    void fetch("/api/save-pattern", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression, json: saveData }),
    });

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleDownload = () => {
    if (!patternData || !expression) return;

    const downloadData: PatternJson = {
      ...patternData,
      grid: gridData,
      color,
      size: { width: cols, height: rows },
    };

    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${expression}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // gridData/colorが変わったらpatternDataも同期
  useEffect(() => {
    if (!patternData) return;
    setPatternData((prev) =>
      prev ? { ...prev, grid: gridData, color, size: { width: cols, height: rows } } : prev,
    );
  }, [gridData, color, rows, cols]);

  if (!isOpen || !expression) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ（クリックで閉じる） */}
      <div className="absolute inset-0 bg-black/80" onClick={handleClose} />

      {/* モーダル本体 */}
      <div
        className="relative z-10 flex flex-col bg-[#231834] text-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh]"
        style={{ border: "2px solid #E66CBC" }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-[#E66CBC]/30">
          <h2 className="text-xl font-bold">パターン編集: {expression}</h2>
          <button onClick={handleClose} className="text-2xl hover:text-[#E66CBC] transition-colors">
            ×
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-[#E66CBC]/30 shrink-0">
          <button
            onClick={() => setActiveTab("visual")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "visual" ? "bg-[#E66CBC] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            ビジュアルエディタ
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "preview" ? "bg-[#E66CBC] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            プレビュー
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading && <div className="text-center">読み込み中...</div>}

          {!isLoading && activeTab === "visual" && (
            <div className="space-y-4">
              {/* カラー */}
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

              {/* 補助線トグル */}
              <div className="flex flex-col gap-2 p-4 bg-[#1a1324] rounded border border-[#E66CBC]/30">
                <div className="font-medium text-sm mb-2">補助線:</div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCenterLineH}
                      onChange={(e) => setShowCenterLineH(e.target.checked)}
                      className="w-4 h-4 accent-[#E66CBC]"
                    />
                    <span className="text-sm">
                      中央線（横）<span className="text-yellow-400 ml-1">━</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCenterLineV}
                      onChange={(e) => setShowCenterLineV(e.target.checked)}
                      className="w-4 h-4 accent-[#E66CBC]"
                    />
                    <span className="text-sm">
                      中央線（縦）<span className="text-yellow-400 ml-1">┃</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEyeOnlyLine}
                      onChange={(e) => setShowEyeOnlyLine(e.target.checked)}
                      className="w-4 h-4 accent-[#E66CBC]"
                    />
                    <span className="text-sm">
                      スマホ区切り（{patternData?.metadata.eyeOnlyRows ?? 14}行目）
                      <span className="text-cyan-400 ml-1">━</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEyeMouthGuide}
                      onChange={(e) => setShowEyeMouthGuide(e.target.checked)}
                      className="w-4 h-4 accent-[#E66CBC]"
                    />
                    <span className="text-sm">
                      目・口の位置ガイド
                      <span className="text-[#64C8FF] ml-1">■目</span>
                      <span className="text-[#FF78B4] ml-1">■口</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* グリッド */}
              <div className="flex justify-center">
                <EditorGridWithGuides
                  showCenterLineH={showCenterLineH}
                  showCenterLineV={showCenterLineV}
                  showEyeOnlyLine={showEyeOnlyLine}
                  eyeOnlyRows={patternData?.metadata.eyeOnlyRows ?? 14}
                  showEyeMouthGuide={showEyeMouthGuide}
                />
              </div>
            </div>
          )}

          {!isLoading && activeTab === "preview" && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm text-gray-400">現在の編集結果のプレビュー</div>
              <canvas
                ref={previewCanvasRef}
                className="border border-[#E66CBC]/30 rounded"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#E66CBC]/30 shrink-0">
          {savedMessage && <span className="text-green-400 text-sm mr-auto">保存しました！</span>}
          <button
            onClick={handleClose}
            className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            閉じる
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-2 rounded border border-[#E66CBC] text-[#E66CBC] hover:bg-[#E66CBC]/10 transition-colors"
          >
            JSONダウンロード
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded bg-[#E66CBC] hover:bg-[#d55bab] transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

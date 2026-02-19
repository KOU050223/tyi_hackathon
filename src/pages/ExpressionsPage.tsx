import { useState, useRef, useEffect, useCallback } from "react";
import { ExpressionCard } from "@/components/expressions/ExpressionCard";
import { PatternEditorModal } from "@/components/expressions/PatternEditorModal";
import { RinaBoardView } from "@/components/board/RinaBoardView";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ALL_DETECTABLE_EXPRESSIONS } from "@/constants/expression";
import type { DeviceType } from "@/types/device";
import type { Expression } from "@/types/expression";

type ViewMode = "smartphone" | "tablet" | "both";

export default function ExpressionsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [editingExpression, setEditingExpression] = useState<Expression | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewExpression, setPreviewExpression] = useState<Expression | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRendererRef = useRef<CanvasRenderer | null>(null);
  const actualDeviceType = useDeviceType();

  const handleEdit = (expression: Expression) => {
    setEditingExpression(expression);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpression(null);
  };

  const handlePreview = useCallback((expression: Expression) => {
    setPreviewExpression(expression);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewExpression(null);
    previewRendererRef.current = null;
  }, []);

  // プレビュー表示時にレンダリング
  useEffect(() => {
    if (!previewExpression || !previewCanvasRef.current) return;

    if (!previewRendererRef.current) {
      previewRendererRef.current = new CanvasRenderer(previewCanvasRef.current);
    }

    const deviceType: DeviceType = actualDeviceType;
    previewRendererRef.current.render(previewExpression, deviceType).catch((err) => {
      console.error("Failed to render preview:", err);
    });
  }, [previewExpression, actualDeviceType]);

  // 全面プレビュー表示
  if (previewExpression) {
    return (
      <RinaBoardView canvasRef={previewCanvasRef}>
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 10,
          }}
        >
          <button
            onClick={handleClosePreview}
            style={{
              padding: "10px 16px",
              fontSize: "14px",
              backgroundColor: "#E66CBC",
              color: "#1A1225",
              border: "none",
              cursor: "pointer",
              borderRadius: "8px",
              fontWeight: "bold",
              boxShadow: "0 4px 8px rgba(230, 108, 188, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 14 4 9 9 4" />
              <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
            </svg>
            表情一覧に戻る
          </button>
        </div>
      </RinaBoardView>
    );
  }

  return (
    <div className="min-h-screen text-[#F5F0FF] font-mono">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#E66CBC] mb-3">表情一覧</h1>
          <p className="text-[#A89BBE] mb-6">このアプリで利用可能な10種類の表情パターン</p>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("smartphone")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === "smartphone"
                  ? "bg-[#E66CBC] text-black"
                  : "border border-[#E66CBC]/30 text-[#E66CBC] hover:bg-[#E66CBC]/10"
              }`}
            >
              スマートフォン版
            </button>
            <button
              onClick={() => setViewMode("tablet")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === "tablet"
                  ? "bg-[#E66CBC] text-black"
                  : "border border-[#E66CBC]/30 text-[#E66CBC] hover:bg-[#E66CBC]/10"
              }`}
            >
              タブレット版
            </button>
            <button
              onClick={() => setViewMode("both")}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === "both"
                  ? "bg-[#E66CBC] text-black"
                  : "border border-[#E66CBC]/30 text-[#E66CBC] hover:bg-[#E66CBC]/10"
              }`}
            >
              両方
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_DETECTABLE_EXPRESSIONS.map((expression) => (
            <ExpressionCard
              key={expression}
              expression={expression}
              deviceType={viewMode === "both" ? "smartphone" : (viewMode as DeviceType)}
              showBothDeviceTypes={viewMode === "both"}
              onEdit={handleEdit}
              onPreview={handlePreview}
            />
          ))}
        </div>

        <PatternEditorModal
          expression={editingExpression}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />

        <div className="mt-8 p-4 border border-[#E66CBC]/30 rounded">
          <h2 className="text-[#E66CBC] text-lg mb-2">使い方</h2>
          <ul className="text-sm text-[#A89BBE] space-y-1">
            <li>• カメラで顔を認識すると、表情に応じてドット絵が変化します</li>
            <li>• スマートフォン版は目のみ、タブレット版は目+口が表示されます</li>
            <li>• 各表情は優先度順に判定され、最も強い表情が表示されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

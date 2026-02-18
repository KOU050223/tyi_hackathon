import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPattern } from "@/lib/patterns";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { RinaBoardView } from "@/components/board/RinaBoardView";
import type { PatternData } from "@/types/firebase";

export default function DisplayPage() {
  const { patternId } = useParams<{ patternId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [pattern, setPattern] = useState<PatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patternId) {
      setError("パターンIDが指定されていません");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getPattern(patternId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("パターンが見つかりません");
        } else {
          setPattern(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError("パターンの取得に失敗しました");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patternId]);

  useEffect(() => {
    if (!pattern || !canvasRef.current) return;

    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }

    rendererRef.current.renderPattern({
      color: pattern.color,
      grid: pattern.gridData,
    });
  }, [pattern]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#A89BBE] font-mono">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#F5F0FF] font-mono gap-4">
        <p className="text-[#FF5A7E]">{error}</p>
        <button
          onClick={() => navigate("/gallery")}
          className="px-4 py-2 border border-[#E66CBC]/30 text-[#E66CBC] rounded hover:bg-[#E66CBC]/10 transition-colors cursor-pointer"
        >
          ギャラリーに戻る
        </button>
      </div>
    );
  }

  return (
    <RinaBoardView canvasRef={canvasRef}>
      {/* 左上: パターン名 */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 10,
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: "#A89BBE",
            backgroundColor: "rgba(26, 18, 37, 0.7)",
            padding: "6px 12px",
            borderRadius: "6px",
          }}
        >
          {pattern?.name || "Untitled"}
        </p>
      </div>

      {/* 右下: 戻るボタン */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate("/gallery")}
          style={{
            padding: "10px 24px",
            fontSize: "14px",
            backgroundColor: "#E66CBC",
            color: "#1A1225",
            border: "none",
            cursor: "pointer",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(230, 108, 188, 0.4)",
          }}
        >
          ギャラリーに戻る
        </button>
      </div>
    </RinaBoardView>
  );
}

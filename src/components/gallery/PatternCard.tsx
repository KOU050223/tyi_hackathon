import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  likePattern,
  unlikePattern,
  isLikedByMe,
  incrementDownloads,
} from "@/lib/patterns";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { getExpressionLabel } from "@/utils/expressionDetector";
import type { PatternData } from "@/types/firebase";

interface PatternCardProps {
  pattern: PatternData;
  showDeleteButton?: boolean;
  onDelete?: (patternId: string) => void;
}

export function PatternCard({
  pattern,
  showDeleteButton,
  onDelete,
}: PatternCardProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(pattern.likes);
  const [liking, setLiking] = useState(false);

  const isOwner = user?.uid === pattern.userId;

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    isLikedByMe(pattern.id, user.uid).then((result) => {
      if (!cancelled) setLiked(result);
    });
    return () => {
      cancelled = true;
    };
  }, [pattern.id, user, isAuthenticated]);

  useEffect(() => {
    if (pattern.previewImageUrl || !canvasRef.current) return;
    try {
      const renderer = new CanvasRenderer(canvasRef.current);
      rendererRef.current = renderer;
      renderer.setDotSize(8);
      renderer.render(pattern.expressionType, pattern.deviceType);
    } catch {
      // Canvas context not available
    }
  }, [pattern.previewImageUrl, pattern.expressionType, pattern.deviceType]);

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isAuthenticated || !user || liking) return;
      setLiking(true);
      try {
        if (liked) {
          await unlikePattern(pattern.id, user.uid);
          setLiked(false);
          setLikeCount((c) => Math.max(0, c - 1));
        } else {
          await likePattern(pattern.id, user.uid);
          setLiked(true);
          setLikeCount((c) => c + 1);
        }
      } catch {
        // Like/unlike failed silently
      } finally {
        setLiking(false);
      }
    },
    [isAuthenticated, user, liking, liked, pattern.id],
  );

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const data = JSON.stringify(
          {
            name: pattern.name,
            expressionType: pattern.expressionType,
            deviceType: pattern.deviceType,
            color: pattern.color,
            gridData: pattern.gridData,
          },
          null,
          2,
        );
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pattern.name || "pattern"}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await incrementDownloads(pattern.id);
      } catch {
        // Download failed
      }
    },
    [pattern],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete(pattern.id);
      }
    },
    [onDelete, pattern.id],
  );

  const handleCardClick = () => {
    if (isOwner) {
      navigate(`/editor/${pattern.id}`);
    }
  };

  const formattedDate = pattern.createdAt
    ? new Date(pattern.createdAt).toLocaleDateString("ja-JP")
    : "";

  return (
    <div
      onClick={handleCardClick}
      className={`border border-[#E66CBC]/20 bg-[#231834] rounded p-3 font-mono transition-colors ${
        isOwner ? "cursor-pointer hover:border-[#E66CBC]/60" : ""
      }`}
    >
      <div className="aspect-square bg-[#1A1225] rounded overflow-hidden mb-2 flex items-center justify-center">
        {pattern.previewImageUrl ? (
          <img
            src={pattern.previewImageUrl}
            alt={pattern.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ imageRendering: "pixelated" }}
          />
        )}
      </div>

      <h3 className="text-[#F5F0FF] text-sm font-bold truncate mb-1">
        {pattern.name || "Untitled"}
      </h3>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E66CBC]/10 text-[#E66CBC] border border-[#E66CBC]/30">
          {getExpressionLabel(pattern.expressionType)}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7DD3E8]/10 text-[#7DD3E8] border border-[#7DD3E8]/30">
          {pattern.deviceType === "smartphone" ? "SP" : "Tablet"}
        </span>
        {showDeleteButton && !pattern.isPublic && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-600">
            非公開
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[#A89BBE]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1 transition-colors ${
              liked ? "text-red-500" : "text-[#A89BBE] hover:text-red-400"
            } ${!isAuthenticated ? "cursor-default" : "cursor-pointer"}`}
            title={
              isAuthenticated
                ? liked
                  ? "いいねを取り消す"
                  : "いいね"
                : "ログインしていいね"
            }
          >
            <span>{liked ? "♥" : "♥"}</span>
            <span>{likeCount}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-[#A89BBE] hover:text-[#E66CBC] transition-colors cursor-pointer"
            title="ダウンロード"
          >
            <span>↓</span>
            <span>{pattern.downloads}</span>
          </button>

          {showDeleteButton && onDelete && (
            <button
              onClick={handleDelete}
              className="text-[#A89BBE] hover:text-red-500 transition-colors cursor-pointer"
              title="削除"
            >
              ×
            </button>
          )}
        </div>

        <span className="text-[#7B6B96] text-[10px]">{formattedDate}</span>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getMyPatterns, deletePattern } from "@/lib/patterns";
import { deletePreviewImage } from "@/lib/storage";
import { PatternCard } from "@/components/gallery/PatternCard";
import { PatternCardSkeleton } from "@/components/gallery/PatternCardSkeleton";
import type { PatternData } from "@/types/firebase";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPatterns = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getMyPatterns(user.uid);
      setPatterns(result);
    } catch {
      // Fetch failed
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyPatterns();
  }, [fetchMyPatterns]);

  const handleDelete = useCallback(
    async (patternId: string) => {
      const confirmed = window.confirm(
        "このパターンを削除しますか？この操作は取り消せません。",
      );
      if (!confirmed) return;

      try {
        const target = patterns.find((p) => p.id === patternId);
        if (target?.previewImageUrl) {
          await deletePreviewImage(patternId);
        }
        await deletePattern(patternId);
        setPatterns((prev) => prev.filter((p) => p.id !== patternId));
      } catch {
        // Delete failed
      }
    },
    [patterns],
  );

  return (
    <div className="min-h-screen text-[#F5F0FF] font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8 p-4 border border-[#E66CBC]/20 bg-[#231834] rounded">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? "User"}
              className="w-16 h-16 rounded-full border-2 border-[#E66CBC]/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#2D1F42] border-2 border-[#E66CBC]/30 flex items-center justify-center text-[#E66CBC] text-xl">
              {user?.displayName?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">
              {user?.displayName ?? "Anonymous"}
            </h1>
            <p className="text-sm text-[#A89BBE]">{patterns.length} パターン</p>
          </div>
          <button
            onClick={() => navigate("/editor")}
            className="px-4 py-2 border border-[#E66CBC]/30 text-[#E66CBC] rounded hover:bg-[#E66CBC]/10 transition-colors text-sm cursor-pointer"
          >
            + 新しいパターンを作成
          </button>
        </div>

        <h2 className="text-lg font-bold text-[#E66CBC] mb-4">マイパターン</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PatternCardSkeleton key={i} />
            ))}
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#A89BBE] mb-4">パターンがありません</p>
            <Link to="/editor" className="text-[#E66CBC] hover:underline">
              最初のパターンを作成する
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                showDeleteButton
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

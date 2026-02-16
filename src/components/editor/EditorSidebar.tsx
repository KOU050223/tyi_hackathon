import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEditorStore } from "@/stores/editorStore";
import { createPattern, updatePattern } from "@/lib/patterns";
import { uploadPreviewImage } from "@/lib/storage";
import { useNavigate, useParams } from "react-router-dom";
import type { Expression } from "@/types/expression";
import type { DeviceType } from "@/types/device";

const EXPRESSIONS: { value: Expression; label: string }[] = [
  { value: "neutral", label: "ニュートラル" },
  { value: "smile", label: "笑顔" },
  { value: "sad", label: "悲しみ" },
  { value: "angry", label: "怒り" },
  { value: "surprised", label: "驚き" },
  { value: "blink", label: "まばたき" },
  { value: "confused", label: "困惑" },
  { value: "smug", label: "ドヤ顔" },
  { value: "questioning", label: "疑問" },
  { value: "embarrassed", label: "照れ" },
];

export function EditorSidebar() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const name = useEditorStore((s) => s.name);
  const expressionType = useEditorStore((s) => s.expressionType);
  const deviceType = useEditorStore((s) => s.deviceType);
  const isPublic = useEditorStore((s) => s.isPublic);
  const tags = useEditorStore((s) => s.tags);
  const gridData = useEditorStore((s) => s.gridData);
  const color = useEditorStore((s) => s.color);
  const setName = useEditorStore((s) => s.setName);
  const setExpressionType = useEditorStore((s) => s.setExpressionType);
  const setDeviceType = useEditorStore((s) => s.setDeviceType);
  const setIsPublic = useEditorStore((s) => s.setIsPublic);
  const setTags = useEditorStore((s) => s.setTags);
  const setGridSize = useEditorStore((s) => s.setGridSize);
  const cols = useEditorStore((s) => s.cols);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState(tags.join(", "));

  const handleDeviceChange = (dt: DeviceType) => {
    setDeviceType(dt);
    const defaultRows = dt === "smartphone" ? 6 : 10;
    setGridSize(defaultRows, cols);
  };

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    const parsed = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setTags(parsed);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      setError("パターン名を入力してください");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let patternId: string;
      if (id) {
        await updatePattern(id, {
          name: name.trim(),
          expressionType,
          deviceType,
          color,
          gridData,
          isPublic,
          tags,
        });
        patternId = id;
      } else {
        patternId = await createPattern({
          userId: user.uid,
          name: name.trim(),
          expressionType,
          deviceType,
          color,
          gridData,
          isPublic,
          tags,
        });
      }

      // プレビュー画像のアップロード
      const previewCanvas = document.querySelector<HTMLCanvasElement>("#editor-preview-canvas");
      if (previewCanvas) {
        const previewUrl = await uploadPreviewImage(patternId, previewCanvas);
        await updatePattern(patternId, { previewImageUrl: previewUrl });
      }

      navigate(`/editor/${patternId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-[#E66CBC]/30 bg-[#231834] rounded font-mono">
      {/* Pattern Name */}
      <div>
        <label className="block text-[#E66CBC]/70 text-xs mb-1">PATTERN NAME</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Pattern"
          className="w-full px-3 py-2 bg-[#1A1225] border border-[#3D2A55] text-[#E66CBC] font-mono text-sm focus:border-[#E66CBC] focus:outline-none"
        />
      </div>

      {/* Expression Type */}
      <div>
        <label className="block text-[#E66CBC]/70 text-xs mb-1">EXPRESSION</label>
        <select
          value={expressionType}
          onChange={(e) => setExpressionType(e.target.value as Expression)}
          className="w-full px-3 py-2 bg-[#1A1225] border border-[#3D2A55] text-[#E66CBC] font-mono text-sm focus:border-[#E66CBC] focus:outline-none"
        >
          {EXPRESSIONS.map((exp) => (
            <option key={exp.value} value={exp.value}>
              {exp.label}
            </option>
          ))}
        </select>
      </div>

      {/* Device Type */}
      <div>
        <label className="block text-[#E66CBC]/70 text-xs mb-1">DEVICE TYPE</label>
        <div className="flex gap-2">
          <label
            className={`flex-1 text-center px-3 py-2 border cursor-pointer text-sm transition-colors ${
              deviceType === "smartphone"
                ? "border-[#E66CBC] bg-[#E66CBC]/20 text-[#E66CBC]"
                : "border-[#3D2A55] text-[#A89BBE] hover:border-[#E66CBC]/50"
            }`}
          >
            <input
              type="radio"
              name="deviceType"
              value="smartphone"
              checked={deviceType === "smartphone"}
              onChange={() => handleDeviceChange("smartphone")}
              className="sr-only"
            />
            Smartphone
          </label>
          <label
            className={`flex-1 text-center px-3 py-2 border cursor-pointer text-sm transition-colors ${
              deviceType === "tablet"
                ? "border-[#E66CBC] bg-[#E66CBC]/20 text-[#E66CBC]"
                : "border-[#3D2A55] text-[#A89BBE] hover:border-[#E66CBC]/50"
            }`}
          >
            <input
              type="radio"
              name="deviceType"
              value="tablet"
              checked={deviceType === "tablet"}
              onChange={() => handleDeviceChange("tablet")}
              className="sr-only"
            />
            Tablet
          </label>
        </div>
      </div>

      {/* Public Toggle */}
      <div>
        <label className="block text-[#E66CBC]/70 text-xs mb-1">VISIBILITY</label>
        <button
          onClick={() => setIsPublic(!isPublic)}
          className={`w-full px-3 py-2 border font-mono text-sm transition-colors ${
            isPublic
              ? "border-[#E66CBC] bg-[#E66CBC]/20 text-[#E66CBC]"
              : "border-[#3D2A55] text-[#A89BBE]"
          }`}
        >
          {isPublic ? "Public" : "Private"}
        </button>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[#E66CBC]/70 text-xs mb-1">TAGS (comma separated)</label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => handleTagInputChange(e.target.value)}
          placeholder="cute, pixel, smile"
          className="w-full px-3 py-2 bg-[#1A1225] border border-[#3D2A55] text-[#E66CBC] font-mono text-sm focus:border-[#E66CBC] focus:outline-none"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs border border-[#E66CBC]/30 text-[#E66CBC]/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-2">
        {user ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-3 border border-[#E66CBC] text-[#E66CBC] font-mono text-sm hover:bg-[#E66CBC]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : id ? "Update Pattern" : "Save Pattern"}
          </button>
        ) : (
          <div className="text-center p-3 border border-[#FFCC4D]/30 text-[#FFCC4D] text-sm">
            保存するにはログインしてください
          </div>
        )}
        {error && <p className="text-[#FF5A7E] text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}

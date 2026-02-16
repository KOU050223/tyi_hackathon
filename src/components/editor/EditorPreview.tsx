import { useEffect, useRef } from "react";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { useEditorStore } from "@/stores/editorStore";

export function EditorPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const gridData = useEditorStore((s) => s.gridData);
  const color = useEditorStore((s) => s.color);

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
      rendererRef.current.setDotSize(20);
    }
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.renderPattern({ color, grid: gridData });
    }
  }, [gridData, color]);

  return (
    <div className="p-4 border border-[#E66CBC]/30 bg-[#231834] rounded font-mono">
      <label className="block text-[#E66CBC]/70 text-xs mb-2">PREVIEW</label>
      <div className="flex justify-center">
        <canvas
          id="editor-preview-canvas"
          ref={canvasRef}
          className="border border-[#3D2A55]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}

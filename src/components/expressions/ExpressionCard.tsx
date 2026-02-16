import { useEffect, useRef } from "react";
import { CanvasRenderer } from "@/engines/renderer/CanvasRenderer";
import { getDotPattern } from "@/utils/dotPatterns";
import { getExpressionLabel } from "@/utils/expressionDetector";
import type { Expression } from "@/types/expression";
import type { DeviceType } from "@/types/device";

interface ExpressionCardProps {
  expression: Expression;
  deviceType?: DeviceType;
  showBothDeviceTypes?: boolean;
}

export function ExpressionCard({
  expression,
  deviceType = "smartphone",
  showBothDeviceTypes = false,
}: ExpressionCardProps) {
  const smartphoneCanvasRef = useRef<HTMLCanvasElement>(null);
  const tabletCanvasRef = useRef<HTMLCanvasElement>(null);
  const smartphoneRendererRef = useRef<CanvasRenderer | null>(null);
  const tabletRendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(() => {
    if (showBothDeviceTypes || deviceType === "smartphone") {
      if (smartphoneCanvasRef.current && !smartphoneRendererRef.current) {
        smartphoneRendererRef.current = new CanvasRenderer(
          smartphoneCanvasRef.current,
        );
        smartphoneRendererRef.current.setDotSize(15);
        const pattern = getDotPattern(expression, "smartphone");
        smartphoneRendererRef.current.renderPattern(pattern);
      }
    }

    if (showBothDeviceTypes || deviceType === "tablet") {
      if (tabletCanvasRef.current && !tabletRendererRef.current) {
        tabletRendererRef.current = new CanvasRenderer(tabletCanvasRef.current);
        tabletRendererRef.current.setDotSize(15);
        const pattern = getDotPattern(expression, "tablet");
        tabletRendererRef.current.renderPattern(pattern);
      }
    }

    return () => {
      smartphoneRendererRef.current = null;
      tabletRendererRef.current = null;
    };
  }, [showBothDeviceTypes, deviceType, expression]);

  useEffect(() => {
    if (smartphoneRendererRef.current) {
      const pattern = getDotPattern(expression, "smartphone");
      smartphoneRendererRef.current.renderPattern(pattern);
    }

    if (tabletRendererRef.current) {
      const pattern = getDotPattern(expression, "tablet");
      tabletRendererRef.current.renderPattern(pattern);
    }
  }, [expression, deviceType, showBothDeviceTypes]);

  return (
    <div className="bg-[#231834] border border-[#E66CBC]/30 rounded-lg p-4 hover:border-[#E66CBC]/60 transition-colors">
      <h3 className="text-[#E66CBC] text-lg font-bold mb-3 text-center">
        {getExpressionLabel(expression)}
      </h3>

      <div className="flex flex-col gap-3">
        {showBothDeviceTypes ? (
          <>
            <div className="flex flex-col items-center">
              <p className="text-xs text-[#A89BBE] mb-1">スマートフォン版</p>
              <canvas
                ref={smartphoneCanvasRef}
                className="border border-[#3D2A55]"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs text-[#A89BBE] mb-1">タブレット版</p>
              <canvas
                ref={tabletCanvasRef}
                className="border border-[#3D2A55]"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <canvas
              ref={
                deviceType === "smartphone"
                  ? smartphoneCanvasRef
                  : tabletCanvasRef
              }
              className="border border-[#3D2A55]"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

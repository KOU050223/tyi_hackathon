import { useState } from "react";
import { ExpressionCard } from "@/components/expressions/ExpressionCard";
import { ALL_DETECTABLE_EXPRESSIONS } from "@/utils/expressionDetector";
import type { DeviceType } from "@/types/device";

type ViewMode = "smartphone" | "tablet" | "both";

export default function ExpressionsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("both");

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
            />
          ))}
        </div>

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

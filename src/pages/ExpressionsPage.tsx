import { useState } from 'react'
import { ExpressionCard } from '@/components/expressions/ExpressionCard'
import { ALL_EXPRESSIONS } from '@/utils/expressionDetector'
import type { DeviceType } from '@/types/device'

type ViewMode = 'smartphone' | 'tablet' | 'both'

export default function ExpressionsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('both')

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#00FF00] mb-3">
            表情一覧
          </h1>
          <p className="text-gray-400 mb-6">
            このアプリで利用可能な10種類の表情パターン
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('smartphone')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === 'smartphone'
                  ? 'bg-[#00FF00] text-black'
                  : 'border border-[#00FF00]/30 text-[#00FF00] hover:bg-[#00FF00]/10'
              }`}
            >
              スマートフォン版
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === 'tablet'
                  ? 'bg-[#00FF00] text-black'
                  : 'border border-[#00FF00]/30 text-[#00FF00] hover:bg-[#00FF00]/10'
              }`}
            >
              タブレット版
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                viewMode === 'both'
                  ? 'bg-[#00FF00] text-black'
                  : 'border border-[#00FF00]/30 text-[#00FF00] hover:bg-[#00FF00]/10'
              }`}
            >
              両方
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_EXPRESSIONS.map(expression => (
            <ExpressionCard
              key={expression}
              expression={expression}
              deviceType={
                viewMode === 'both' ? 'smartphone' : (viewMode as DeviceType)
              }
              showBothDeviceTypes={viewMode === 'both'}
            />
          ))}
        </div>

        <div className="mt-8 p-4 border border-[#00FF00]/30 rounded">
          <h2 className="text-[#00FF00] text-lg mb-2">使い方</h2>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• カメラで顔を認識すると、表情に応じてドット絵が変化します</li>
            <li>
              • スマートフォン版は目のみ、タブレット版は目+口が表示されます
            </li>
            <li>
              • 各表情は優先度順に判定され、最も強い表情が表示されます
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

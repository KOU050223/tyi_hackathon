import { useEditorStore } from '@/stores/editorStore'

const PRESET_COLORS = [
  '#00FF00',
  '#FFFF00',
  '#FF0000',
  '#4444FF',
  '#FF6600',
  '#FF00FF',
  '#00FFFF',
  '#FFAAAA',
  '#FFAA00',
  '#FFFFFF',
]

export function EditorToolbar() {
  const tool = useEditorStore(s => s.tool)
  const color = useEditorStore(s => s.color)
  const rows = useEditorStore(s => s.rows)
  const cols = useEditorStore(s => s.cols)
  const setTool = useEditorStore(s => s.setTool)
  const setColor = useEditorStore(s => s.setColor)
  const setGridSize = useEditorStore(s => s.setGridSize)
  const clearGrid = useEditorStore(s => s.clearGrid)

  return (
    <div className="flex flex-col gap-4 p-4 border border-[#00FF00]/30 bg-black rounded font-mono">
      {/* Tool Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setTool('draw')}
          className={`flex-1 px-3 py-2 border font-mono text-sm transition-colors ${
            tool === 'draw'
              ? 'border-[#00FF00] bg-[#00FF00]/20 text-[#00FF00]'
              : 'border-[#333] text-[#888] hover:border-[#00FF00]/50'
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => setTool('erase')}
          className={`flex-1 px-3 py-2 border font-mono text-sm transition-colors ${
            tool === 'erase'
              ? 'border-[#FF0000] bg-[#FF0000]/20 text-[#FF0000]'
              : 'border-[#333] text-[#888] hover:border-[#FF0000]/50'
          }`}
        >
          Erase
        </button>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-[#00FF00]/70 text-xs mb-2">COLOR</label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-8 h-8 border border-[#333] bg-transparent cursor-pointer"
          />
          <span className="text-[#00FF00] text-sm">{color}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 border transition-transform hover:scale-110 ${
                color === c ? 'border-white scale-110' : 'border-[#333]'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Grid Size */}
      <div>
        <label className="block text-[#00FF00]/70 text-xs mb-2">
          GRID SIZE: {rows} x {cols}
        </label>
        <input
          type="range"
          min={4}
          max={16}
          value={rows}
          onChange={e => setGridSize(parseInt(e.target.value, 10), cols)}
          className="w-full accent-[#00FF00]"
        />
        <div className="flex justify-between text-[#888] text-xs mt-1">
          <span>4</span>
          <span>16</span>
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={clearGrid}
        className="px-3 py-2 border border-[#FF0000]/50 text-[#FF0000] font-mono text-sm hover:bg-[#FF0000]/10 transition-colors"
      >
        Clear Grid
      </button>
    </div>
  )
}

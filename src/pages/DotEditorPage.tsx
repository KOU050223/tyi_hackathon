import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditorGrid } from '@/components/editor/EditorGrid'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { EditorSidebar } from '@/components/editor/EditorSidebar'
import { EditorPreview } from '@/components/editor/EditorPreview'
import { useEditorStore } from '@/stores/editorStore'
import { getPattern } from '@/lib/patterns'

export default function DotEditorPage() {
  const { id } = useParams<{ id: string }>()
  const loadPattern = useEditorStore((s) => s.loadPattern)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    setLoading(true)
    setError(null)

    getPattern(id)
      .then((pattern) => {
        if (cancelled) return
        if (pattern) {
          loadPattern({
            gridData: pattern.gridData,
            color: pattern.color,
            name: pattern.name,
            expressionType: pattern.expressionType,
            deviceType: pattern.deviceType,
            isPublic: pattern.isPublic,
            tags: pattern.tags,
          })
        } else {
          setError('パターンが見つかりません')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '読み込みに失敗しました')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, loadPattern])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <p className="text-[#00FF00] font-mono animate-pulse">Loading pattern...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <p className="text-[#FF0000] font-mono">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-60px)] p-4 font-mono">
      <h1 className="text-[#00FF00] text-xl mb-4">
        {id ? 'Edit Pattern' : 'New Pattern'}
      </h1>

      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_300px] gap-4">
        {/* Left: Toolbar + Grid */}
        <div className="flex flex-col gap-4">
          <EditorToolbar />
          <div className="flex justify-center p-4 border border-[#00FF00]/30 bg-black rounded">
            <EditorGrid />
          </div>
        </div>

        {/* Right: Sidebar + Preview */}
        <div className="flex flex-col gap-4">
          <EditorSidebar />
          <EditorPreview />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col gap-4 md:hidden">
        <EditorToolbar />
        <div className="flex justify-center p-4 border border-[#00FF00]/30 bg-black rounded">
          <EditorGrid />
        </div>
        <EditorPreview />
        <EditorSidebar />
      </div>
    </div>
  )
}

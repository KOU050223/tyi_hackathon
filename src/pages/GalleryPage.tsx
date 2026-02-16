import { useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { usePatternStore } from '@/stores/patternStore'
import { getPublicPatterns } from '@/lib/patterns'
import { PatternCard } from '@/components/gallery/PatternCard'
import { PatternCardSkeleton } from '@/components/gallery/PatternCardSkeleton'
import { getExpressionLabel, ALL_EXPRESSIONS } from '@/utils/expressionDetector'
import type { Expression } from '@/types/expression'
import type { DeviceType } from '@/types/device'

export default function GalleryPage() {
  const {
    patterns,
    loading,
    sortBy,
    filterExpression,
    filterDevice,
    hasMore,
    lastDoc,
    setSortBy,
    setFilterExpression,
    setFilterDevice,
    setLoading,
    appendPatterns,
    reset,
  } = usePatternStore()

  const fetchPatterns = useCallback(
    async (append = false) => {
      setLoading(true)
      try {
        const result = await getPublicPatterns({
          sortBy,
          expressionType: filterExpression ?? undefined,
          deviceType: filterDevice ?? undefined,
          limit: 12,
          startAfter: append ? (lastDoc ?? undefined) : undefined,
        })
        if (append) {
          appendPatterns(result.patterns, result.lastDoc)
        } else {
          // appendPatterns sets both patterns array and lastDoc/hasMore together
          // Reset first then append to empty array
          appendPatterns(result.patterns, result.lastDoc)
        }
      } catch {
        // Fetch failed
      } finally {
        setLoading(false)
      }
    },
    [
      sortBy,
      filterExpression,
      filterDevice,
      lastDoc,
      setLoading,
      appendPatterns,
    ]
  )

  useEffect(() => {
    reset()
  }, [sortBy, filterExpression, filterDevice, reset])

  useEffect(() => {
    if (patterns.length === 0 && hasMore) {
      fetchPatterns(false)
    }
  }, [patterns.length, hasMore, fetchPatterns])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPatterns(true)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#00FF00]">Gallery</h1>
          <Link
            to="/editor"
            className="text-sm px-3 py-1.5 border border-[#00FF00]/30 text-[#00FF00] rounded hover:bg-[#00FF00]/10 transition-colors"
          >
            + 新規作成
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterExpression ?? ''}
            onChange={e =>
              setFilterExpression((e.target.value || null) as Expression | null)
            }
            className="bg-black border border-[#00FF00]/30 text-white text-sm rounded px-2 py-1.5 focus:border-[#00FF00] focus:outline-none"
          >
            <option value="">すべての表情</option>
            {ALL_EXPRESSIONS.map(expr => (
              <option key={expr} value={expr}>
                {getExpressionLabel(expr)}
              </option>
            ))}
          </select>

          <select
            value={filterDevice ?? ''}
            onChange={e =>
              setFilterDevice((e.target.value || null) as DeviceType | null)
            }
            className="bg-black border border-[#00FF00]/30 text-white text-sm rounded px-2 py-1.5 focus:border-[#00FF00] focus:outline-none"
          >
            <option value="">すべてのデバイス</option>
            <option value="smartphone">スマートフォン</option>
            <option value="tablet">タブレット</option>
          </select>

          <select
            value={sortBy}
            onChange={e =>
              setSortBy(e.target.value as 'latest' | 'popular' | 'downloads')
            }
            className="bg-black border border-[#00FF00]/30 text-white text-sm rounded px-2 py-1.5 focus:border-[#00FF00] focus:outline-none"
          >
            <option value="latest">新着順</option>
            <option value="popular">人気順</option>
            <option value="downloads">DL順</option>
          </select>
        </div>

        {loading && patterns.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PatternCardSkeleton key={i} />
            ))}
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">パターンが見つかりません</p>
            <Link to="/editor" className="text-[#00FF00] hover:underline">
              最初のパターンを作成する
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patterns.map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <PatternCardSkeleton key={`skeleton-${i}`} />
                ))}
            </div>

            {hasMore && !loading && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2 border border-[#00FF00]/30 text-[#00FF00] rounded hover:bg-[#00FF00]/10 transition-colors font-mono cursor-pointer"
                >
                  もっと見る
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

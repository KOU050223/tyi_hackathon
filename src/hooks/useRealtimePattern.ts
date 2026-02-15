import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { PatternData } from '@/types/firebase'

export function useRealtimePattern(patternId: string | null) {
  const [pattern, setPattern] = useState<PatternData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patternId) {
      setPattern(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = onSnapshot(
      doc(db, 'patterns', patternId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setPattern({
            id: snap.id,
            userId: data.userId,
            name: data.name,
            expressionType: data.expressionType,
            deviceType: data.deviceType,
            color: data.color,
            gridData: data.gridData,
            previewImageUrl: data.previewImageUrl,
            isPublic: data.isPublic,
            downloads: data.downloads ?? 0,
            likes: data.likes ?? 0,
            tags: data.tags ?? [],
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
          })
        } else {
          setPattern(null)
        }
        setLoading(false)
      },
      () => {
        setPattern(null)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [patternId])

  return { pattern, loading }
}

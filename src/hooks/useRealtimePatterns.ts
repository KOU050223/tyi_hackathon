import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { PatternData } from '@/types/firebase'
import type { DocumentData } from 'firebase/firestore'

function toPatternData(id: string, data: DocumentData): PatternData {
  return {
    id,
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
  }
}

export function useRealtimePatterns(limitCount = 20) {
  const [patterns, setPatterns] = useState<PatternData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'patterns'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => toPatternData(d.id, d.data()))
        setPatterns(data)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [limitCount])

  return { patterns, loading, error }
}

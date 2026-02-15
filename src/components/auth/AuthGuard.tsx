import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginButton } from './LoginButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          minHeight: '200px',
        }}
      >
        <p style={{ color: '#aaa', fontSize: '14px' }}>
          この機能にはログインが必要です
        </p>
        <LoginButton />
      </div>
    )
  }

  return <>{children}</>
}

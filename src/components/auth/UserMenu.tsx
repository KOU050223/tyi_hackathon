import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const avatarUrl = user.photoURL ?? ''
  const displayName = user.displayName ?? 'User'

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          backgroundColor: 'transparent',
          border: '1px solid rgba(0, 255, 0, 0.3)',
          borderRadius: '20px',
          cursor: 'pointer',
          color: '#00FF00',
          fontSize: '14px',
          fontFamily: 'inherit',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid #00FF00',
            }}
          />
        ) : (
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#00FF00',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {displayName[0].toUpperCase()}
          </span>
        )}
        <span
          style={{
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            minWidth: '160px',
            backgroundColor: '#111',
            border: '1px solid #00FF00',
            borderRadius: '8px',
            boxShadow: '0 0 16px rgba(0, 255, 0, 0.2)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <NavLink
            to="/profile"
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              padding: '10px 16px',
              color: '#00FF00',
              textDecoration: 'none',
              fontSize: '14px',
              borderBottom: '1px solid rgba(0, 255, 0, 0.15)',
            }}
          >
            プロフィール
          </NavLink>
          <button
            onClick={async () => {
              setOpen(false)
              await signOut()
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ff4444',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  )
}

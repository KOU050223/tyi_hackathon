import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'

const navLinks = [
  { to: '/', label: 'ホーム' },
  { to: '/expressions', label: '表情一覧' },
  { to: '/editor', label: 'エディタ' },
  { to: '/gallery', label: 'ギャラリー' },
]

export function Navigation() {
  const { user } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="neon-nav">
      <div className="nav-inner">
        <NavLink to="/" className="nav-logo">
          璃奈ボード
        </NavLink>

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="nav-auth">{user ? <UserMenu /> : <LoginButton />}</div>
      </div>
    </nav>
  )
}

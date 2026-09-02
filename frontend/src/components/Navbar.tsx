import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, isAdmin } from '../store/authStore'

export default function Navbar() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => !!state.token)
  const userIsAdmin = isAdmin(user)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  })
  const cartRef = useRef<HTMLDivElement>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/home')
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/Image/Logo.png" alt="AhorraYa Logo" className="navbar-logo" />
        <span>AhorraYa</span>
      </div>
      <ul className="navbar-links">
        <li><Link to="/home">Inicio</Link></li>
        {isAuthenticated && <li><Link to="/mis-listas">Mis Listas</Link></li>}
        {userIsAdmin && (
          <>
            <li><Link to="/admin/usuarios" className="admin-link">👥 Usuarios</Link></li>
            <li><Link to="/admin/catalogo" className="admin-link">📦 Catálogo</Link></li>
          </>
        )}
      </ul>

      <div className="navbar-actions">
        <button className="btn-theme-toggle" onClick={toggleTheme} title="Cambiar Tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {isAuthenticated && (
          <div className="cart-icon-container" ref={cartRef}>
            <button className="btn-cart-toggle" onClick={() => setIsCartOpen(!isCartOpen)}>
              <span className="cart-icon">🛒</span>
            </button>
          </div>
        )}

        {isAuthenticated ? (
          <>
            <div className="user-info" title={user?.email || ''}>
              <span className="user-avatar">
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : '?'}
              </span>
              <span className="user-name">{user?.nombre || user?.email || 'Usuario'}</span>
              {userIsAdmin && <span className="admin-badge">ADMIN</span>}
            </div>

            <button onClick={handleLogout} className="btn-logout">Salir</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-login">Iniciar sesión</Link>
            <Link to="/registro" className="btn-register">Registrarse</Link>
          </>
        )}
      </div>

      <style>{`
        .navbar {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 2rem; background-color: var(--brand-blue);
          color: white; box-shadow: var(--nav-shadow);
          position: sticky; top: 0; z-index: 100;
        }
        .navbar-brand { display: flex; align-items: center; gap: 0.75rem; font-size: 1.4rem; font-weight: 800; color: var(--brand-peach); }
        .navbar-logo { height: 40px; width: auto; border-radius: 4px; }
        .navbar-links { display: flex; list-style: none; gap: 2rem; margin: 0; padding: 0; }
        .navbar-links a { color: white; text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: opacity 0.2s; }
        .navbar-links a:hover { color: var(--brand-peach); }
        .navbar-actions { display: flex; align-items: center; gap: 1.5rem; }
        .btn-theme-toggle { background: none; border: none; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; transition: transform 0.2s; }
        .btn-theme-toggle:hover { transform: scale(1.1); }
        .btn-cart-toggle { background: none; border: none; cursor: pointer; position: relative; display: flex; align-items: center; }
        .cart-icon { font-size: 1.5rem; }
        .btn-logout { background: transparent; border: 2px solid white; color: white; padding: 0.5rem 1.25rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .btn-logout:hover { background: white; color: var(--brand-blue); }
        .btn-login, .btn-register { color: white; text-decoration: none; font-weight: 700; white-space: nowrap; }
        .btn-register { background: white; color: var(--brand-blue); padding: 0.5rem 1rem; border-radius: 10px; }

        .user-info { display: flex; align-items: center; gap: 0.6rem; background: rgba(255,255,255,0.1); padding: 0.4rem 0.85rem 0.4rem 0.4rem; border-radius: 999px; }
        .user-avatar {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--brand-peach); color: var(--brand-blue);
          font-weight: 800; font-size: 0.95rem;
        }
        .user-name { color: white; font-weight: 600; font-size: 0.9rem; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .admin-badge { background: #fbbf24; color: #1e293b; font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 4px; letter-spacing: 0.5px; }
        .admin-link { background: rgba(251, 191, 36, 0.18); color: #fef08a !important; padding: 0.3rem 0.65rem; border-radius: 6px; font-weight: 600 !important; border: 1px solid rgba(251, 191, 36, 0.4); display: flex; align-items: center; gap: 0.3rem; }
        .admin-link:hover { background: rgba(251, 191, 36, 0.35); color: #ffffff !important; }

        @media (max-width: 600px) {
          .navbar-brand span { display: none; }
          .user-name { display: none; }
          .admin-badge { display: none; }
        }
      `}</style>
    </nav>
  )
}

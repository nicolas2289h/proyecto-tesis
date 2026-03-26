import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Product = {
  id: number
  name: string
  price: number
  image: string
  category: string
  supermarket: string
}

type CartItem = Product & {
  quantity: number
}

const dummyProducts: Product[] = [
  { id: 1, name: 'Leche Entera 1L', price: 1200, image: 'https://via.placeholder.com/150', category: 'Lácteos', supermarket: 'Carrefour' },
  { id: 2, name: 'Pan de Molde 500g', price: 2500, image: 'https://via.placeholder.com/150', category: 'Almacén', supermarket: 'Dia' },
  { id: 3, name: 'Arroz Integral 1kg', price: 1800, image: 'https://via.placeholder.com/150', category: 'Almacén', supermarket: 'Comodin' },
  { id: 4, name: 'Yogur de Vainilla', price: 800, image: 'https://via.placeholder.com/150', category: 'Lácteos', supermarket: 'Carrefour' },
  { id: 5, name: 'Aceite de Girasol 1.5L', price: 3200, image: 'https://via.placeholder.com/150', category: 'Almacén', supermarket: 'Dia' },
  { id: 6, name: 'Café Molido 250g', price: 4500, image: 'https://via.placeholder.com/150', category: 'Infusiones', supermarket: 'Comodin' },
  { id: 7, name: 'Yerba Mate 1kg', price: 3800, image: 'https://via.placeholder.com/150', category: 'Infusiones', supermarket: 'Carrefour' },
  { id: 8, name: 'Fideos Spaghetti 500g', price: 1100, image: 'https://via.placeholder.com/150', category: 'Almacén', supermarket: 'Dia' },
]

export default function Home() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name')
  const [filterSupermarket, setFilterSupermarket] = useState<string>('all')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  })
  const cartRef = useRef<HTMLDivElement>(null)

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
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const totalCartPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)

  const filteredProducts = dummyProducts
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => filterSupermarket === 'all' || p.supermarket === filterSupermarket)
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      return a.name.localeCompare(b.name)
    })

  const supermarkets = ['all', ...Array.from(new Set(dummyProducts.map(p => p.supermarket)))]

  return (
    <div className="home-container">
      {/* Navbar Horizontal */}
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="/Image/Logo.png" alt="AhorraYa Logo" className="navbar-logo" />
          <span>AhorraYa</span>
        </div>
        <ul className="navbar-links">
          <li><Link to="/home">Inicio</Link></li>
          <li><Link to="/mis-listas">Mis Listas</Link></li>
          <li><a href="#ofertas">Ofertas</a></li>
        </ul>

        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button className="btn-theme-toggle" onClick={toggleTheme} title="Cambiar Tema">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Icono del Carrito */}
          <div className="cart-icon-container" ref={cartRef}>
            <button className="btn-cart-toggle" onClick={() => setIsCartOpen(!isCartOpen)}>
              <span className="cart-icon">🛒</span>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>

            {/* Dropdown del Carrito */}
            {isCartOpen && (
              <div className="cart-dropdown">
                <div className="cart-dropdown-header">
                  <h3>Tu Carrito</h3>
                </div>
                <div className="cart-dropdown-items">
                  {cart.length > 0 ? (
                    cart.map(item => (
                      <div key={item.id} className="cart-dropdown-item">
                        <div className="item-details">
                          <p className="item-name">{item.name}</p>
                          <p className="item-price">${item.price} x {item.quantity}</p>
                        </div>
                        <div className="item-actions">
                          <div className="qty-controls">
                            <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                          </div>
                          <button className="btn-remove" onClick={() => removeFromCart(item.id)}>×</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-cart-msg">No hay productos en el carrito</p>
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="cart-dropdown-footer">
                    <div className="cart-total">
                      <span>Total:</span>
                      <span>${totalCartPrice}</span>
                    </div>
                    <button className="btn-checkout">Finalizar Compra</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="btn-logout">Salir</button>
        </div>
      </nav>

      <header className="home-header">
        <h1 className="home-title">Tu Comparador de Precios</h1>
        <p className="subtitle">Encontrá los mejores precios y ahorrá en cada compra.</p>

        <div className="controls-container">
          <div className="search-container">
            <input
              type="text"
              placeholder="¿Qué estás buscando hoy?"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters-bar">
            <div className="filter-group">
              <label>Supermercado:</label>
              <select value={filterSupermarket} onChange={(e) => setFilterSupermarket(e.target.value)}>
                {supermarkets.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'Todos' : s}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Ordenar por:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="name">Nombre (A-Z)</option>
                <option value="price-asc">Precio (Menor a Mayor)</option>
                <option value="price-desc">Precio (Mayor a Menor)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="home-content">
        <section className="products-section">
          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    <img src={product.image} alt={product.name} className="product-image" />
                    <span className="product-super-badge">{product.supermarket}</span>
                  </div>
                  <div className="product-info">
                    <div className="product-header">
                      <span className="product-category">{product.category}</span>
                    </div>
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-footer">
                      <p className="product-price">${product.price}</p>
                      <button className="btn-add-plus" onClick={() => addToCart(product)} title="Agregar al carrito">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results-container">
                <p className="no-results">No se encontraron productos que coincidan con tu búsqueda.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .home-container { min-height: 100vh; background-color: var(--secondary-color); }

        /* Navbar & Brand */
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

        /* Theme Toggle */
        .btn-theme-toggle { background: none; border: none; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; transition: transform 0.2s; }
        .btn-theme-toggle:hover { transform: scale(1.1); }

        /* Cart & Badge */
        .btn-cart-toggle { background: none; border: none; cursor: pointer; position: relative; display: flex; align-items: center; }
        .cart-icon { font-size: 1.5rem; }
        .cart-badge {
          position: absolute; top: -8px; right: -8px; background-color: var(--brand-peach); color: var(--brand-blue);
          font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; border: 1.5px solid var(--brand-blue);
        }

        /* Cart Dropdown */
        .cart-dropdown {
          position: absolute; top: 100%; right: 0; margin-top: 12px; background: var(--white);
          width: 320px; border-radius: 12px; box-shadow: var(--card-shadow);
          color: var(--text-dark); padding: 1.25rem; z-index: 200; border: 1px solid var(--accent-color);
        }
        .cart-dropdown-header h3 { margin: 0; font-size: 1.1rem; color: var(--brand-blue); }
        .cart-dropdown-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--accent-color); }
        .item-name { margin: 0; font-weight: 600; font-size: 0.85rem; }
        .item-price { color: var(--text-muted); font-size: 0.8rem; }
        .qty-controls { display: flex; align-items: center; gap: 0.5rem; background: var(--secondary-color); padding: 0.2rem 0.5rem; border-radius: 4px; }
        .qty-controls button { border: none; background: none; cursor: pointer; font-weight: bold; color: var(--brand-blue); }
        .btn-checkout { width: 100%; background-color: var(--brand-blue); color: white; border: none; padding: 0.9rem; border-radius: 8px; font-weight: 700; cursor: pointer; }

        /* Header & Controls */
        .home-header { text-align: center; padding: 2.5rem 1rem; background: var(--white); margin-bottom: 2rem; border-bottom: 1px solid var(--accent-color); }
        .home-title { font-size: 2.2rem; color: var(--brand-blue); margin-bottom: 0.5rem; font-weight: 800; }
        .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1.5rem; }
        .controls-container { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
        .search-container { position: relative; width: 100%; max-width: 550px; margin: 0 auto; }
        .search-input { 
          width: 100%; padding: 0.9rem 1.5rem 0.9rem 3.5rem; border-radius: 30px; 
          border: 2px solid var(--accent-color); background: var(--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238ca4b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") no-repeat 1.25rem center; 
          color: var(--text-dark); font-size: 1rem; outline: none; transition: all 0.2s ease; box-shadow: var(--card-shadow); 
        }
        .search-input:focus { border-color: var(--brand-blue); box-shadow: 0 6px 15px rgba(0,0,0,0.06); }

        .filters-bar { display: flex; justify-content: center; gap: 2.5rem; flex-wrap: wrap; }
        .filter-group { display: flex; align-items: center; gap: 0.75rem; color: var(--brand-blue); font-weight: 600; font-size: 0.95rem; }
        .filter-group select { padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid var(--accent-color); background: var(--white); color: var(--text-dark); font-size: 0.9rem; outline: none; }

        /* Products Grid */
        .home-content { padding: 0 2rem 4rem; max-width: 1300px; margin: 0 auto; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 2.5rem; }
        
        .product-card { 
          background: var(--white); border-radius: 16px; overflow: hidden; 
          box-shadow: var(--card-shadow); border: 1px solid var(--accent-color); display: flex; flex-direction: column;
        }
        .product-card:hover { transform: translateY(-8px); }

        .product-image-container { position: relative; width: 100%; height: 200px; background-color: var(--secondary-color); }
        .product-image { width: 100%; height: 100%; object-fit: contain; padding: 1rem; }
        
        .product-super-badge {
          position: absolute; top: 12px; right: 12px;
          background: var(--brand-blue); color: white;
          padding: 4px 10px; border-radius: 20px; font-size: 0.7rem;
          font-weight: 700; text-transform: uppercase;
        }

        .product-info { padding: 1.5rem; flex-grow: 1; display: flex; flex-direction: column; }
        .product-category { color: var(--brand-blue); font-weight: 800; font-size: 0.75rem; text-transform: uppercase; }
        .product-name { font-size: 1.1rem; margin: 0.5rem 0 1rem 0; color: var(--text-dark); font-weight: 700; min-height: 3rem; }
        .product-price { font-size: 1.5rem; font-weight: 800; color: var(--brand-blue); }
        
        .btn-add-plus { 
          background-color: var(--brand-blue); color: white; 
          border: none; width: 44px; height: 44px; border-radius: 50%; 
          font-size: 1.8rem; cursor: pointer; display: flex; align-items: center; 
          justify-content: center;
        }
        .btn-add-plus:hover { background-color: var(--primary-color); }

        .btn-logout { background: transparent; border: 2px solid white; color: white; padding: 0.5rem 1.25rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .btn-logout:hover { background: white; color: var(--brand-blue); }

        @media (max-width: 600px) {
          .navbar-brand span { display: none; }
          .home-title { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  )
}

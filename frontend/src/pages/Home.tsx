import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Supermercado, ProductoBusqueda, ListaCompra } from '../types/Supermercado'
import { productoApi } from '../api/productoApi'
import { supermercadoApi } from '../api/supermercadoApi'
import { listaApi } from '../api/listaApi'
import { useAuthStore } from '../store/authStore'

interface ProductoComparativo {
  id: number
  producto: string
  marca: string
  precio: number
  urlImagen: string
  supermercado: string
}

export default function Home() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => !!state.token)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filterSupermarket, setFilterSupermarket] = useState<number | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default')
  const [supermarkets, setSupermarkets] = useState<Supermercado[]>([])
  const [products, setProducts] = useState<ProductoBusqueda[]>([])
  const [productosComparativos, setProductosComparativos] = useState<ProductoComparativo[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros para productos comparativos
  const [filtroMarcaComparativos, setFiltroMarcaComparativos] = useState('')
  const [filtroProductoComparativos, setFiltroProductoComparativos] = useState('')
  const [filtroSupermercadoComparativos, setFiltroSupermercadoComparativos] = useState('')
  const [sortOrderComparativos, setSortOrderComparativos] = useState<'default' | 'asc' | 'desc'>('desc')

  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductoBusqueda | null>(null)
  const [selectedListId, setSelectedListId] = useState<number | string>('')
  const [quantity, setQuantity] = useState(1)
  const [listOptions, setListOptions] = useState<ListaCompra[]>([])
  const [adding, setAdding] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const searchDebounceRef = useRef<number | null>(null)

  const fetchInitial = async () => {
    setLoading(true)
    setError(null)
    const [supersResult, listasResult, comparativosResult] = await Promise.allSettled([
      supermercadoApi.getAll(),
      isAuthenticated ? listaApi.getAll() : Promise.resolve([]),
      productoApi.obtenerComparativos(),
    ])

    let supers: Supermercado[] = []
    let authWarning: string | null = null

    if (supersResult.status === 'fulfilled') {
      supers = supersResult.value
      setSupermarkets(supers)
    }

    if (isAuthenticated && listasResult.status === 'fulfilled') {
      setListOptions(listasResult.value)
    } else if (isAuthenticated && listasResult.status === 'rejected') {
      console.warn('No se pudieron cargar las listas del usuario (posiblemente sin sesión):', listasResult.reason)
      const status = (listasResult.reason as any)?.response?.status
      if (status === 401 || status === 403) {
        authWarning = 'Para crear y administrar listas de compras, iniciá sesión.'
      }
    }

    if (comparativosResult.status === 'fulfilled') {
      setProductosComparativos(comparativosResult.value)
    } else {
      console.warn('Error cargando productos comparativos:', comparativosResult.reason)
    }

    if (supersResult.status === 'rejected') {
      console.error('Error cargando supermercados:', supersResult.reason)
      setError('No se pudieron cargar los supermercados. Revisá la conexión con el backend.')
    } else if (authWarning) {
      setError(authWarning)
    }

    setLoading(false)
    return supers
  }

  const fetchProducts = async (nombre: string, supermercadoId: number | 'all') => {
    try {
      setSearching(true)
      setError(null)
      const sid = supermercadoId === 'all' ? undefined : Number(supermercadoId)
      const prods = await productoApi.buscar(nombre || undefined, sid)
      setProducts(prods)
    } catch (err) {
      console.error('Error buscando productos:', err)
      setError('No se pudieron cargar los productos. Revisá la conexión con el backend.')
      setProducts([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await fetchInitial()
      if (!cancelled) fetchProducts('', 'all')
    }
    run()
    return () => { cancelled = true }
  }, [isAuthenticated])

  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = window.setTimeout(() => {
      setAppliedSearch(searchTerm)
    }, 400)
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchProducts(appliedSearch, filterSupermarket)
  }, [appliedSearch, filterSupermarket])

  const filteredProducts = useMemo<ProductoBusqueda[]>(() => {
    const list = [...products]
    if (sortOrder === 'asc') list.sort((a, b) => a.precio - b.precio)
    else if (sortOrder === 'desc') list.sort((a, b) => b.precio - a.precio)
    return list
  }, [products, sortOrder])

  // Filtrar y ordenar productos comparativos
  const productosFiltradosPorProductoYMarca = useMemo(() => {
    return productosComparativos.filter(p => {
      const coincideProducto = !filtroProductoComparativos || 
        p.producto.toLowerCase().includes(filtroProductoComparativos.toLowerCase())
      const coincideMarca = !filtroMarcaComparativos || 
        p.marca.toLowerCase().includes(filtroMarcaComparativos.toLowerCase())
      return coincideProducto && coincideMarca
    })
  }, [productosComparativos, filtroProductoComparativos, filtroMarcaComparativos])

  const supermercadosComparativos = useMemo(() => {
    return [...new Set(productosFiltradosPorProductoYMarca.map(p => p.supermercado))].sort()
  }, [productosFiltradosPorProductoYMarca])

  const productosFiltradosComparativos = useMemo(() => {
    return productosFiltradosPorProductoYMarca.filter(p => {
      const coincideSupermercado = !filtroSupermercadoComparativos || 
        p.supermercado === filtroSupermercadoComparativos
      return coincideSupermercado
    })
  }, [productosFiltradosPorProductoYMarca, filtroSupermercadoComparativos])

  const productosOrdenadosComparativos = useMemo<ProductoComparativo[]>(() => {
    const list = [...productosFiltradosComparativos]
    if (sortOrderComparativos === 'asc') list.sort((a, b) => a.precio - b.precio)
    else if (sortOrderComparativos === 'desc') list.sort((a, b) => b.precio - a.precio)
    return list
  }, [productosFiltradosComparativos, sortOrderComparativos])

  const openAddModal = (product: ProductoBusqueda) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setSelectedProduct(product)
    setSelectedListId(listOptions.length ? listOptions[0].id : '')
    setQuantity(1)
    setShowModal(true)
    setSuccessMsg(null)
  }

  const handleAddToList = async () => {
    if (!selectedProduct || selectedListId === '') return
    
    setAdding(true)
    try {
      let productId = selectedProduct.id
      const listaId = Number(selectedListId)

      // Si el ID es inválido (producto comparativo), buscar por nombre
      if (productId <= 0) {
        const prods = await productoApi.buscar(selectedProduct.nombreGenerico)
        if (prods.length > 0) {
          productId = prods[0].id
        } else {
          console.error('Producto no encontrado en búsqueda:', selectedProduct.nombreGenerico)
          alert('No se encontró el producto para agregarlo a la lista.')
          setAdding(false)
          return
        }
      }

      await listaApi.addItem(listaId, productId, quantity)
      setSuccessMsg(`"${selectedProduct.nombreGenerico}" agregado correctamente.`)
      setTimeout(() => {
        setShowModal(false)
        setSuccessMsg(null)
      }, 1200)
    } catch (err) {
      console.error('Error agregando item a la lista:', err)
      alert('No se pudo agregar el producto a la lista.')
    } finally {
      setAdding(false)
    }
  }

  const goCreateList = () => {
    setShowModal(false)
    navigate('/mis-listas')
  }

  const refreshLists = async () => {
    if (!isAuthenticated) return
    try {
      const listas = await listaApi.getAll()
      setListOptions(listas)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <header className="home-header">
        <h1 className="home-title">Tu Comparador de Precios</h1>
        <p className="subtitle">Encontrá los mejores precios y ahorrá en cada compra.</p>

        <div className="controls-container">
          {/* Mostrar búsqueda solo cuando hay filtro activo de búsqueda */}
          {appliedSearch || filterSupermarket !== 'all' && (
            <div className="search-container">
              <input
                type="text"
                placeholder="¿Qué estás buscando hoy? (ej: fideo, arroz, aceite)"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {/* Filtros para búsqueda de productos */}
          {appliedSearch || filterSupermarket !== 'all' ? (
            <div className="filters-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="filter-group">
                <label>🏪 Supermercado:</label>
                <select
                  value={filterSupermarket}
                  onChange={(e) => setFilterSupermarket(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                >
                  <option value="all">Todos</option>
                  {supermarkets.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>💰 Orden:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'default' | 'asc' | 'desc')}
                >
                  <option value="default">Por defecto</option>
                  <option value="asc">Precio: Menor a Mayor</option>
                  <option value="desc">Precio: Mayor a Menor</option>
                </select>
              </div>
            </div>
          ) : (
            /* Filtros para productos comparativos - mostrados en inicio */
            <div className="filters-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', placeItems: 'start' }}>
              <div className="filter-group" style={{ width: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                  📦 Producto:
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por producto..."
                  className="search-input"
                  value={filtroProductoComparativos}
                  onChange={(e) => setFiltroProductoComparativos(e.target.value)}
                  style={{ margin: 0, width: '100%' }}
                />
              </div>
              <div className="filter-group" style={{ width: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                  🏷️ Marca:
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por marca..."
                  className="search-input"
                  value={filtroMarcaComparativos}
                  onChange={(e) => setFiltroMarcaComparativos(e.target.value)}
                  style={{ margin: 0, width: '100%' }}
                />
              </div>
              <div className="filter-group" style={{ width: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                  🏪 Supermercado:
                </label>
                <select
                  value={filtroSupermercadoComparativos}
                  onChange={(e) => setFiltroSupermercadoComparativos(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Todos los supermercados</option>
                  {supermercadosComparativos.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{ width: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                  💰 Precio:
                </label>
                <select
                  value={sortOrderComparativos}
                  onChange={(e) => setSortOrderComparativos(e.target.value as 'default' | 'asc' | 'desc')}
                  style={{ width: '100%' }}
                >
                  <option value="default">Por defecto</option>
                  <option value="asc">Menor a Mayor</option>
                  <option value="desc">Mayor a Menor</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="home-content">
        <section className="products-section">
          {loading ? (
            <div className="no-results-container">
              <div className="grid-skeleton">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card-skeleton" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {error && !error.startsWith('Para') && (
                <div className="top-banner" style={{ display: 'none' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div className="error-banner-inline">{error}</div>
                    <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => fetchProducts(appliedSearch, filterSupermarket)}>
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
              {error && error.startsWith('Para') && (
                <div className="top-banner">
                  <div className="auth-banner">
                    <span>🔐 {error}</span>
                    <button className="btn" style={{ padding: '0.45rem 1.1rem' }} onClick={() => navigate('/login')}>
                      Iniciar sesión
                    </button>
                  </div>
                </div>
              )}
              <div className="results-summary">
                {searching ? (
                  <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>🔄 Buscando...</span>
                ) : appliedSearch || filterSupermarket !== 'all' ? (
                  <>Mostrando <strong>{filteredProducts.length}</strong> producto{filteredProducts.length !== 1 ? 's' : ''} filtrados</>
                ) : (
                  <>📊 Productos Destacados - <strong>{productosOrdenadosComparativos.length}</strong> producto{productosOrdenadosComparativos.length !== 1 ? 's' : ''}</>
                )}
              </div>

              {/* Mostrar resultados de búsqueda si hay búsqueda o filtro */}
              {(appliedSearch || filterSupermarket !== 'all') ? (
                filteredProducts.length > 0 ? (
                  <div className="product-grid">
                    {filteredProducts.map((product) => (
                      <div key={`${product.id}-${product.nombreSupermercado}`} className="product-card">
                        <div className="product-image-container">
                          <img
                            src={product.urlImagen || 'https://via.placeholder.com/400?text=Producto'}
                            alt={product.nombreGenerico}
                            className="product-image"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = '1'
                                target.src = 'https://via.placeholder.com/400x400.png?text=Sin+imagen'
                              }
                            }}
                          />
                          <span className="product-super-badge">{product.nombreSupermercado}</span>
                        </div>
                        <div className="product-info">
                          <div className="product-header">
                            <span className="product-category">{product.marca || 'Sin marca'}</span>
                          </div>
                          <h3 className="product-name">{product.nombreGenerico}</h3>
                          <p className="product-description">
                            {product.descripcion || 'Sin descripción disponible.'}
                          </p>
                          <div className="product-footer">
                            <p className="product-price">${Number(product.precio || 0).toLocaleString('es-AR')}</p>
                            <button
                              className="product-action-btn"
                              onClick={() => openAddModal(product)}
                              onMouseEnter={refreshLists}
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results-container">
                    <p className="no-results">No se encontraron productos que coincidan con tu búsqueda.</p>
                    <p className="no-results-hint">Probá con otro término, cambiá el supermercado o verificá que el scraper haya cargado precios.</p>
                  </div>
                )
              ) : (
                /* Mostrar productos comparativos cuando no hay búsqueda */
                productosOrdenadosComparativos.length > 0 ? (
                  <div className="product-grid">
                    {productosOrdenadosComparativos.map((product, index) => (
                      <div key={`comparativo-${index}`} className="product-card">
                        <div className="product-image-container">
                          <img
                            src={product.urlImagen || 'https://via.placeholder.com/400?text=Producto'}
                            alt={product.producto}
                            className="product-image"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = '1'
                                target.src = 'https://via.placeholder.com/400x400.png?text=Sin+imagen'
                              }
                            }}
                          />
                          <span className="product-super-badge">🏪 {product.supermercado}</span>
                        </div>
                        <div className="product-info">
                          <div className="product-header">
                            <span className="product-category">{product.marca || 'Sin marca'}</span>
                          </div>
                          <h3 className="product-name">{product.producto}</h3>
                          <p className="product-description">
                            Producto destacado
                          </p>
                          <div className="product-footer">
                            <p className="product-price">${Number(product.precio || 0).toLocaleString('es-AR')}</p>
                            <button
                              className="product-action-btn"
                              onClick={() => {
                                if (!isAuthenticated) {
                                  navigate('/login')
                                  return
                                }
                                setSelectedProduct({ 
                                  id: product.id,
                                  nombreGenerico: product.producto,
                                  marca: product.marca || '',
                                  precio: product.precio,
                                  nombreSupermercado: product.supermercado,
                                  urlImagen: product.urlImagen,
                                  varianteEspecifica: '',
                                  descripcion: ''
                                } as ProductoBusqueda)
                                setSelectedListId(listOptions.length ? String(listOptions[0].id) : '')
                                setQuantity(1)
                                setShowModal(true)
                                setSuccessMsg(null)
                              }}
                              onMouseEnter={refreshLists}
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results-container">
                    <p className="no-results">No hay productos disponibles en este momento.</p>
                    <p className="no-results-hint">Probá realizando una búsqueda específica.</p>
                  </div>
                )
              )}
            </>
          )}
        </section>
      </main>

      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => !adding && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Agregar a mi lista</h2>
            <div className="modal-product-info">
              <img
                src={selectedProduct.urlImagen || 'https://via.placeholder.com/120?text=Producto'}
                alt={selectedProduct.nombreGenerico}
                className="modal-product-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = '1'
                    target.src = 'https://via.placeholder.com/120x120.png?text=Producto'
                  }
                }}
              />
              <div>
                <p className="modal-product-name">{selectedProduct.nombreGenerico}</p>
                <p className="modal-product-brand">{selectedProduct.marca} · {selectedProduct.nombreSupermercado}</p>
                <p className="modal-product-price">${Number(selectedProduct.precio || 0).toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="modal-fields">
              {listOptions.length === 0 ? (
                <div className="empty-lists-warning">
                  <p>⚠️ Todavía no tenés listas creadas.</p>
                  <button className="btn btn-secondary" onClick={goCreateList}>
                    Crear mi primera lista
                  </button>
                </div>
              ) : (
                <>
                  <div className="field">
                    <label className="label">Lista destino</label>
                    <select
                      className="input"
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                    >
                      <option value="">Seleccioná una lista</option>
                      {listOptions.map(l => (
                        <option key={l.id} value={String(l.id)}>
                          {l.favorita ? '⭐ ' : ''}{l.nombreLista}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">Cantidad</label>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </>
              )}
            </div>

            {successMsg && <div className="modal-success">✅ {successMsg}</div>}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={adding}
              >
                Cancelar
              </button>
              {listOptions.length > 0 && (
                <button
                  className="btn"
                  onClick={handleAddToList}
                  disabled={adding || selectedListId === ''}
                >
                  {adding ? 'Agregando...' : 'Confirmar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .home-header { text-align: center; padding: 2.5rem 1rem; background: var(--white); margin-bottom: 2rem; border-bottom: 1px solid var(--accent-color); }
        .home-title { font-size: 2.2rem; color: var(--brand-blue); margin-bottom: 0.5rem; font-weight: 800; }
        .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1.5rem; }
        .controls-container { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
        .search-container { position: relative; width: 100%; max-width: 720px; margin: 0 auto; }
        .search-input {
          width: 100%; padding: 0.9rem 1.5rem 0.9rem 3.5rem; border-radius: 30px;
          border: 2px solid var(--accent-color); background: var(--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238ca4b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") no-repeat 1.25rem center;
          color: var(--text-dark); font-size: 1rem; outline: none; transition: all 0.2s ease; box-shadow: var(--card-shadow);
        }
        .search-input:focus { border-color: var(--brand-blue); box-shadow: 0 6px 15px rgba(0,0,0,0.06); }

        .filters-bar { display: flex; justify-content: center; gap: 2.5rem; flex-wrap: wrap; }
        .filter-group { display: flex; align-items: center; gap: 0.75rem; color: var(--brand-blue); font-weight: 600; font-size: 0.95rem; }
        .filter-group select { padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid var(--accent-color); background: var(--white); color: var(--text-dark); font-size: 0.9rem; outline: none; }

        .home-content { padding: 0 2rem 4rem; max-width: 1400px; margin: 0 auto; }
        .results-summary { color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.95rem; font-weight: 500; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.75rem; }

        .product-card {
          background: var(--white); border-radius: 16px; overflow: hidden;
          box-shadow: var(--card-shadow); border: 1px solid var(--accent-color); display: flex; flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .product-card:hover { transform: translateY(-6px); box-shadow: 0 10px 28px rgba(0,0,0,0.09); }

        .product-image-container { position: relative; width: 100%; height: 220px; background-color: var(--secondary-color); display: flex; align-items: center; justify-content: center; }
        .product-image { width: 100%; height: 100%; object-fit: cover; padding: 0.75rem; background: var(--white); }

        .product-super-badge {
          position: absolute; top: 12px; right: 12px;
          background: var(--brand-blue); color: white;
          padding: 4px 10px; border-radius: 20px; font-size: 0.7rem;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
        }

        .product-info { padding: 1.25rem 1.25rem 1.5rem; flex-grow: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .product-header { display: flex; justify-content: space-between; align-items: center; }
        .product-category { color: var(--brand-blue); font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.4px; }
        .product-name { font-size: 1rem; margin: 0; color: var(--text-dark); font-weight: 700; line-height: 1.35; min-height: 2.8rem; }
        .product-description {
          font-size: 0.85rem; color: var(--text-muted); line-height: 1.45;
          margin: 0; min-height: 3.6rem;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
          overflow: hidden; text-overflow: ellipsis;
        }
        .product-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.85rem; border-top: 1px dashed var(--accent-color); }
        .product-price { font-size: 1.4rem; font-weight: 800; color: var(--brand-blue); margin: 0; }
        .product-action-btn {
          background: var(--brand-peach);
          color: var(--text-dark);
          border: none;
          padding: 0.55rem 1rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .product-action-btn:hover { filter: brightness(0.95); transform: scale(1.04); }
        .product-action-btn:active { transform: scale(0.97); }

        .no-results-container { width: 100%; grid-column: 1/-1; text-align: center; padding: 3rem 1rem; }
        .no-results { color: var(--text-muted); font-size: 1.1rem; margin: 0 0 0.5rem 0; }
        .no-results-hint { color: var(--text-muted); font-size: 0.9rem; opacity: 0.85; margin: 0; }

        .error-banner-inline { background: #fee2e2; color: #dc2626; padding: 1rem 1.25rem; border-radius: 10px; font-weight: 600; display: inline-block; }

        .top-banner { margin-bottom: 1.5rem; text-align: center; }
        .auth-banner {
          display: inline-flex; align-items: center; gap: 1rem; flex-wrap: wrap;
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe; border-radius: 10px;
          padding: 0.75rem 1rem; font-weight: 600;
        }
        .auth-banner .btn { margin: 0; }

        .grid-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.75rem; }
        .card-skeleton {
          height: 380px; border-radius: 16px;
          background: linear-gradient(90deg, var(--secondary-color) 25%, rgba(0,0,0,0.05) 37%, var(--secondary-color) 63%);
          background-size: 400% 100%; animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; padding: 1rem;
        }
        .modal-content {
          width: 100%; max-width: 480px;
          background: var(--white); border-radius: 16px; padding: 1.75rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .modal-title { font-size: 1.35rem; color: var(--text-dark); font-weight: 800; margin-bottom: 1.25rem; }
        .modal-product-info { display: flex; gap: 1rem; padding: 1rem; background: var(--secondary-color); border-radius: 12px; margin-bottom: 1.25rem; }
        .modal-product-img { width: 90px; height: 90px; object-fit: cover; border-radius: 10px; background: var(--white); }
        .modal-product-name { font-weight: 700; color: var(--text-dark); margin: 0 0 0.25rem 0; line-height: 1.3; }
        .modal-product-brand { color: var(--text-muted); font-size: 0.85rem; margin: 0 0 0.35rem 0; }
        .modal-product-price { color: var(--brand-blue); font-weight: 800; font-size: 1.15rem; margin: 0; }
        .modal-fields { margin-bottom: 1rem; }
        .empty-lists-warning { text-align: center; padding: 1rem; background: #fff7ed; border: 1px dashed #fdba74; border-radius: 10px; color: #9a3412; }
        .empty-lists-warning p { margin: 0 0 0.75rem 0; font-size: 0.9rem; }
        .modal-success { background: #dcfce7; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; margin-bottom: 1rem; text-align: center; }
        .modal-actions { display: flex; gap: 0.75rem; }
        .btn-secondary { background-color: #e5e7eb; color: #374151; }
        .btn-secondary:hover { filter: brightness(0.95); }

        @media (max-width: 600px) {
          .home-title { font-size: 1.8rem; }
          .home-content { padding: 0 1rem 3rem; }
          .product-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.2rem; }
          .filters-bar { gap: 1rem; }
        }
      `}</style>
    </>
  )
}

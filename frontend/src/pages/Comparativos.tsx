import { useState, useEffect, useMemo } from 'react'
import { productoApi } from '../api/productoApi'
import { listaApi } from '../api/listaApi'
import type { ListaCompra } from '../types/Supermercado'

interface ProductoComparativo {
  producto: string
  marca: string
  precio: number
  urlImagen: string
  supermercado: string
}

export default function Comparativos() {
  const [productos, setProductos] = useState<ProductoComparativo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroMarca, setFiltroMarca] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroSupermercado, setFiltroSupermercado] = useState('')
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('desc')
  const [listOptions, setListOptions] = useState<ListaCompra[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductoComparativo | null>(null)
  const [selectedListId, setSelectedListId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchProductosComparativos()
    fetchListas()
  }, [])

  const fetchProductosComparativos = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productoApi.obtenerComparativos()
      setProductos(data)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar productos comparativos')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchListas = async () => {
    try {
      const listas = await listaApi.getAll()
      setListOptions(listas)
    } catch (err) {
      console.error('Error cargando listas:', err)
    }
  }

  const supermercados = useMemo(() => {
    return [...new Set(productos.map(p => p.supermercado))].sort()
  }, [productos])

  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const coincideProducto = !filtroProducto || 
        p.producto.toLowerCase().includes(filtroProducto.toLowerCase())
      const coincideMarca = !filtroMarca || 
        p.marca.toLowerCase().includes(filtroMarca.toLowerCase())
      const coincideSupermercado = !filtroSupermercado || 
        p.supermercado === filtroSupermercado
      return coincideProducto && coincideMarca && coincideSupermercado
    })
  }, [productos, filtroProducto, filtroMarca, filtroSupermercado])

  const productosOrdenados = useMemo<ProductoComparativo[]>(() => {
    const list = [...productosFiltrados]
    if (sortOrder === 'asc') list.sort((a, b) => a.precio - b.precio)
    else if (sortOrder === 'desc') list.sort((a, b) => b.precio - a.precio)
    return list
  }, [productosFiltrados, sortOrder])

  const openAddModal = (product: ProductoComparativo) => {
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
      // Usar el nombre del producto como búsqueda
      const prods = await productoApi.buscar(selectedProduct.producto)
      if (prods.length > 0) {
        await listaApi.addItem(selectedListId, prods[0].id, quantity)
        setSuccessMsg(`"${selectedProduct.producto}" agregado correctamente.`)
        setTimeout(() => {
          setShowModal(false)
          setSuccessMsg(null)
        }, 1200)
      } else {
        alert('No se encontró el producto para agregarlo a la lista.')
      }
    } catch (err) {
      console.error('Error agregando item a la lista:', err)
      alert('No se pudo agregar el producto a la lista.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Premium */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text text-5xl font-black">
              📊 Comparativa de Precios
            </span>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Encuentra los mejores precios de productos en todos los supermercados. Filtra, compara y ahorra dinero.
          </p>
        </div>

        {/* Filtros Premium */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 backdrop-blur-md border border-slate-600 rounded-2xl p-8 mb-10 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🔍 Filtros</span>
            <div className="h-1 flex-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Filtro Producto */}
            <div className="relative group">
              <label className="text-sm uppercase font-bold text-blue-300 mb-2 block">Producto</label>
              <input
                type="text"
                placeholder="ej: Fideo, Arroz..."
                className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300"
                value={filtroProducto}
                onChange={(e) => setFiltroProducto(e.target.value)}
              />
              <div className="absolute inset-y-0 right-3 top-8 flex items-center text-gray-400 text-xl">📦</div>
            </div>

            {/* Filtro Marca */}
            <div className="relative group">
              <label className="text-sm uppercase font-bold text-blue-300 mb-2 block">Marca</label>
              <input
                type="text"
                placeholder="ej: Lucchetti..."
                className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300"
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
              />
              <div className="absolute inset-y-0 right-3 top-8 flex items-center text-gray-400 text-xl">🏷️</div>
            </div>

            {/* Filtro Supermercado */}
            <div className="relative group">
              <label className="text-sm uppercase font-bold text-blue-300 mb-2 block">Supermercado</label>
              <select
                className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 text-white rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300 appearance-none cursor-pointer"
                value={filtroSupermercado}
                onChange={(e) => setFiltroSupermercado(e.target.value)}
              >
                <option value="">🏪 Todos</option>
                {supermercados.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 top-8 flex items-center text-gray-400 text-xl pointer-events-none">▼</div>
            </div>

            {/* Ordenar por Precio */}
            <div className="relative group">
              <label className="text-sm uppercase font-bold text-blue-300 mb-2 block">Ordenar Precio</label>
              <select
                className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 text-white rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300 appearance-none cursor-pointer"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'default' | 'asc' | 'desc')}
              >
                <option value="default">Por defecto</option>
                <option value="asc">💰 Menor a Mayor</option>
                <option value="desc">💸 Mayor a Menor</option>
              </select>
              <div className="absolute inset-y-0 right-3 top-8 flex items-center text-gray-400 text-xl pointer-events-none">▼</div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-900 border-2 border-red-500 text-red-100 px-6 py-4 rounded-xl mb-8 flex items-center gap-3 backdrop-blur-sm">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-bold">Error al cargar productos</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg font-semibold">Cargando productos...</p>
            </div>
          </div>
        )}

        {/* Resumen */}
        {!loading && (
          <>
            <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
                📦 {productosOrdenados.length} producto{productosOrdenados.length !== 1 ? 's' : ''} encontrado{productosOrdenados.length !== 1 ? 's' : ''}
              </div>
              <div className="text-gray-300 text-sm">
                de {productos.length} total
              </div>
            </div>

            {/* Grid de Productos */}
            {productosOrdenados.length === 0 ? (
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-2xl p-16 text-center backdrop-blur-sm">
                <p className="text-gray-300 text-2xl font-bold mb-2">🔍 Sin resultados</p>
                <p className="text-gray-400">No se encontraron productos con esos filtros. Intenta con otros términos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productosOrdenados.map((producto, index) => (
                  <div
                    key={index}
                    className="group bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl overflow-hidden border border-slate-600 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1"
                  >
                    {/* Imagen Container */}
                    <div className="relative h-56 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
                      <img
                        src={producto.urlImagen || 'https://via.placeholder.com/300x300?text=Producto'}
                        alt={producto.producto}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Sin+imagen'
                        }}
                      />
                      {/* Supermercado Badge */}
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold px-3 py-1 rounded-full text-sm shadow-lg">
                        🏪 {producto.supermercado}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 flex flex-col h-full">
                      {/* Marca */}
                      <div className="mb-3">
                        <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {producto.marca || 'Sin marca'}
                        </span>
                      </div>

                      {/* Nombre Producto */}
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                        {producto.producto}
                      </h3>

                      {/* Precio */}
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mb-4 mt-auto">
                        <p className="text-xs text-green-100 font-semibold text-center mb-1">PRECIO</p>
                        <p className="text-3xl font-black text-white text-center">
                          ${producto.precio.toFixed(2)}
                        </p>
                      </div>

                      {/* Botón */}
                      <button
                        onClick={() => openAddModal(producto)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        🛒 Agregar al carrito
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal mejorado */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-600 animate-slideUp">
            <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text mb-6">
              🛒 Agregar a mi lista
            </h2>

            {/* Producto Info */}
            <div className="mb-6 rounded-2xl overflow-hidden border-2 border-slate-600">
              <img
                src={selectedProduct.urlImagen || 'https://via.placeholder.com/400x300?text=Producto'}
                alt={selectedProduct.producto}
                className="w-full h-40 object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Producto'
                }}
              />
              <div className="bg-slate-700 p-4">
                <p className="font-bold text-white text-lg">{selectedProduct.producto}</p>
                <p className="text-sm text-gray-300 mb-2">{selectedProduct.marca} • {selectedProduct.supermercado}</p>
                <p className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text">
                  ${selectedProduct.precio.toFixed(2)}
                </p>
              </div>
            </div>

            {listOptions.length === 0 ? (
              <div className="bg-yellow-900 border-2 border-yellow-600 rounded-xl p-4 mb-6">
                <p className="text-yellow-300 font-bold">⚠️ Sin listas creadas</p>
                <p className="text-sm text-yellow-200 mt-1">Crea una lista en "Mis Listas" para agregar productos.</p>
              </div>
            ) : (
              <>
                {/* Select Lista */}
                <div className="mb-6">
                  <label className="block text-sm uppercase font-bold text-blue-300 mb-2">Lista destino</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all appearance-none cursor-pointer"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <option value="" disabled>Seleccioná una lista</option>
                    {listOptions.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.favorita ? '⭐ ' : ''}{l.nombreLista}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad */}
                <div className="mb-6">
                  <label className="block text-sm uppercase font-bold text-blue-300 mb-2">Cantidad</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg w-10 h-10 rounded-lg transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="flex-1 px-4 py-2 bg-slate-700 border-2 border-slate-600 text-white text-center rounded-lg focus:outline-none focus:border-blue-400"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg w-10 h-10 rounded-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {successMsg && (
                  <div className="bg-green-900 border-2 border-green-500 text-green-100 px-4 py-3 rounded-xl mb-4 font-semibold text-center">
                    ✅ {successMsg}
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex gap-3">
                  <button
                    onClick={() => !adding && setShowModal(false)}
                    className="flex-1 px-4 py-3 border-2 border-slate-600 text-gray-300 hover:text-white rounded-xl hover:bg-slate-700 font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddToList}
                    disabled={adding || selectedListId === ''}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/50"
                  >
                    {adding ? '⏳ Agregando...' : '✅ Agregar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Estilos CSS adicionales */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        select option {
          background-color: #1e293b;
          color: white;
        }

        input::placeholder {
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}

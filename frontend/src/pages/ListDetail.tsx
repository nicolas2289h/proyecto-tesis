import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { listaApi } from '../api/listaApi'
import type { ListaCompraDetalle, OptimizacionCompra } from '../types/Supermercado'

export default function ListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [list, setList] = useState<ListaCompraDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizacionCompra | null>(null)

  const listaId = Number(id)

  const fetchListDetail = async () => {
    try {
      setLoading(true)
      const data = await listaApi.getById(listaId)
      setList(data)
    } catch (err) {
      console.error('Error fetching list detail:', err)
      alert('Error al cargar el detalle de la lista')
      navigate('/mis-listas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!Number.isNaN(listaId)) fetchListDetail()
  }, [listaId])

  const handleOptimize = async () => {
    try {
      setOptimizing(true)
      const result = await listaApi.getCircuitoOptimo(listaId)
      setOptimizationResult(result)
    } catch (err) {
      console.error('Error optimizing list:', err)
      alert('Error al optimizar la lista')
    } finally {
      setOptimizing(false)
    }
  }

  const removeItem = async (itemId: number) => {
    if (!confirm('¿Quitar este producto de la lista?')) return
    try {
      await listaApi.removeItem(listaId, itemId)
      setOptimizationResult(null)
      fetchListDetail()
    } catch (err) {
      console.error('Error eliminando item:', err)
      alert('Error al eliminar el ítem')
    }
  }

  if (loading) return <div className="container"><p>Cargando detalle...</p></div>
  if (!list) return <div className="container"><p>Lista no encontrada</p></div>

  return (
    <div className="container" style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => navigate('/mis-listas')} style={{ backgroundColor: '#6b7280', width: 'auto', padding: '0.6rem 1.25rem' }}>
          ← Volver
        </button>
        <h1 className="title" style={{ margin: 0, textAlign: 'left' }}>
          {list.nombreLista} {list.favorita ? '★' : ''}
        </h1>
        <Link
          to="/home"
          style={{
            marginLeft: 'auto',
            backgroundColor: 'var(--secondary-color)',
            color: 'var(--text-dark)',
            fontWeight: '600',
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--accent-color)',
            textDecoration: 'none'
          }}
        >
          + Agregar productos
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

        <section style={{
          backgroundColor: 'var(--white)',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--accent-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Productos en la lista</h2>
            <button className="btn" onClick={handleOptimize} disabled={optimizing || list.items.length === 0} style={{ width: 'auto', padding: '0.6rem 1.25rem' }}>
              {optimizing ? 'Optimizando...' : '🚀 Optimizar Compra'}
            </button>
          </div>

          {list.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No hay productos en esta lista.
              <br />
              <Link to="/home" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Ir a buscar productos</Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--accent-color)' }}>
                    <th style={{ padding: '0.75rem' }}>Producto</th>
                    <th style={{ padding: '0.75rem' }}>Marca</th>
                    <th style={{ padding: '0.75rem' }}>Cant.</th>
                    <th style={{ padding: '0.75rem' }}>Precio Est.</th>
                    <th style={{ padding: '0.75rem' }}>Supermercado</th>
                    <th style={{ padding: '0.75rem' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--accent-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '600' }}>{item.productoNombre}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{item.marca}</td>
                      <td style={{ padding: '0.75rem' }}>{item.cantidad}</td>
                      <td style={{ padding: '0.75rem', fontWeight: '700' }}>${item.precioTotal?.toLocaleString('es-AR') || '-'}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{item.supermercadoNombre}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.5rem', fontWeight: '700' }}
                          title="Quitar producto"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: '1rem', fontWeight: '700', textAlign: 'right' }}>Total Estimado:</td>
                    <td style={{ padding: '1rem', fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary-color)' }}>${list.totalEstimado?.toLocaleString('es-AR') || '0'}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {optimizationResult && (
          <section style={{
            backgroundColor: '#f0fdf4',
            padding: '2rem',
            borderRadius: '12px',
            border: '2px solid #22c55e',
            boxShadow: 'var(--card-shadow)'
          }}>
            <h2 style={{ color: '#166534', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✅ Resultado de Optimización
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.875rem', color: '#166534' }}>Total Óptimo</span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>${optimizationResult.totalOptimo.toLocaleString('es-AR')}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.875rem', color: '#166534' }}>Ahorro Total</span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#22c55e' }}>${optimizationResult.totalAhorrado.toLocaleString('es-AR')}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                <span style={{ fontSize: '0.875rem', color: '#991b1b' }}>Total más caro</span>
                <p style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: '#dc2626' }}>${optimizationResult.totalMasCaro.toLocaleString('es-AR')}</p>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>📍 Hoja de Ruta (Dónde comprar)</h3>
            {optimizationResult.hojaDeRuta.map(tienda => (
              <div key={tienda.supermercadoId} style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '10px',
                marginBottom: '1rem',
                borderLeft: '5px solid #22c55e'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#166534' }}>{tienda.supermercadoNombre}</h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {tienda.productos.map(p => (
                    <li key={p.productoId} style={{ marginBottom: '0.5rem' }}>
                      <strong>{p.productoNombre}</strong> ({p.marca}) x {p.cantidad} -
                      <span style={{ color: '#166534', fontWeight: '600' }}> ${p.subtotal.toLocaleString('es-AR')}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ textAlign: 'right', marginTop: '1rem', borderTop: '1px solid #f0fdf4', paddingTop: '0.5rem' }}>
                  <strong>Subtotal en tienda: ${tienda.subtotalTienda.toLocaleString('es-AR')}</strong>
                </div>
              </div>
            ))}

            {optimizationResult.productosSinPrecio.length > 0 && (
              <div style={{ marginTop: '2rem', backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                <h4 style={{ color: '#9a3412', margin: '0 0 0.5rem 0' }}>⚠️ Productos sin precio disponible</h4>
                <p style={{ fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>No pudimos encontrar precios para estos productos en ningún supermercado:</p>
                <ul style={{ margin: 0, fontSize: '0.875rem' }}>
                  {optimizationResult.productosSinPrecio.map(p => (
                    <li key={p.productoId}>{p.productoNombre} ({p.marca})</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

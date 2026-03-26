import { useState, useEffect } from 'react'
import api from '../api/axios'
import { AxiosError } from 'axios'

interface ListaCompra {
  id: number;
  nombreLista: string;
  fechaCreacion: string;
  favorita: boolean;
}

export default function MyLists() {
  const [listas, setListas] = useState<ListaCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para el formulario de creación/edición
  const [isEditing, setIsEditing] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formFav, setFormFav] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchListas = async () => {
    try {
      setLoading(true)
      const response = await api.get('/listas')
      setListas(response.data.data)
    } catch (err) {
      setError('Error al cargar las listas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListas()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    
    setSubmitting(true)
    try {
      if (isEditing) {
        await api.put(`/listas/${isEditing}`, { nombreLista: formName, favorita: formFav })
      } else {
        await api.post('/listas', { nombreLista: formName, favorita: formFav })
      }
      setFormName('')
      setFormFav(false)
      setIsEditing(null)
      fetchListas()
    } catch (err) {
      alert('Error al guardar la lista')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta lista?')) return
    try {
      await api.delete(`/listas/${id}`)
      fetchListas()
    } catch (err) {
      alert('Error al eliminar la lista')
    }
  }

  const toggleFav = async (id: number) => {
    try {
      await api.patch(`/listas/${id}/favorita`)
      // Actualización optimista
      setListas(prev => prev.map(l => l.id === id ? { ...l, favorita: !l.favorita } : l))
    } catch (err) {
      alert('Error al actualizar favorito')
    }
  }

  const startEdit = (lista: ListaCompra) => {
    setIsEditing(lista.id)
    setFormName(lista.nombreLista)
    setFormFav(lista.favorita)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div className="container"><p>Cargando listas...</p></div>

  return (
    <div className="container" style={{ 
      maxWidth: '800px',
      background: 'var(--white)',
      border: '1px solid var(--accent-color)',
      padding: '2rem'
    }}>
      <h1 className="title" style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>Mis Listas</h1>
      
      {/* Formulario de CRUD */}
      <div style={{ 
        backgroundColor: 'var(--secondary-color)', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        marginBottom: '2rem',
        border: '1px solid var(--accent-color)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          marginBottom: '1.25rem', 
          color: 'var(--text-dark)',
          fontWeight: '700'
        }}>
          {isEditing ? '✏️ Editar Lista' : '➕ Nueva Lista'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" style={{ color: 'var(--text-dark)' }}>Nombre de la lista</label>
            <input 
              className="input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Compras del mes"
              required
              style={{
                backgroundColor: 'var(--white)',
                color: 'var(--text-dark)',
                border: '2px solid var(--accent-color)'
              }}
            />
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '1.5rem',
            color: 'var(--text-dark)',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}>
            <input 
              type="checkbox" 
              id="fav" 
              checked={formFav}
              onChange={(e) => setFormFav(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="fav" style={{ cursor: 'pointer', fontWeight: '500' }}>
              Marcar como favorita ⭐
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" type="submit" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? 'Guardando...' : (isEditing ? 'Actualizar Lista' : 'Crear Lista')}
            </button>
            {isEditing && (
              <button 
                className="btn" 
                type="button" 
                onClick={() => { setIsEditing(null); setFormName(''); setFormFav(false); }}
                style={{ 
                  backgroundColor: '#6b7280', 
                  flex: 1 
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Visualización de Listas */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {listas.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: 'var(--text-muted)',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '12px',
            border: '1px dashed var(--accent-color)'
          }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📋</span>
            <p>No tenés listas creadas todavía.</p>
          </div>
        ) : (
          listas.map((lista) => (
            <div key={lista.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--white)',
              borderRadius: '12px',
              boxShadow: 'var(--card-shadow)',
              border: lista.favorita ? '2px solid #fbbf24' : '1px solid var(--accent-color)',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <button 
                  onClick={() => toggleFav(lista.id)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '1.75rem', 
                    cursor: 'pointer',
                    color: lista.favorita ? '#fbbf24' : 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title={lista.favorita ? "Quitar de favoritos" : "Marcar como favorita"}
                >
                  {lista.favorita ? '★' : '☆'}
                </button>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontWeight: '700', 
                    color: 'var(--text-dark)',
                    fontSize: '1.1rem'
                  }}>
                    {lista.nombreLista}
                  </h3>
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    📅 {new Date(lista.fechaCreacion).toLocaleDateString()}
                  </small>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => startEdit(lista)}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.875rem', 
                    backgroundColor: 'rgba(37, 99, 235, 0.1)', 
                    color: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(lista.id)}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    fontSize: '0.875rem', 
                    backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

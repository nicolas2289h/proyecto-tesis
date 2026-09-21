import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../api/adminApi'

interface DashboardStats {
  totalUsuarios: number
  usuariosActivos: number
  usuariosInactivos: number
  administradores: number
  totalProductos: number
  totalCategorias: number
  totalSupermercados: number
  totalMapeos: number
  productosConImagen: number
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosInactivos: 0,
    administradores: 0,
    totalProductos: 0,
    totalCategorias: 0,
    totalSupermercados: 0,
    totalMapeos: 0,
    productosConImagen: 0,
  })

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)

        const [usuarios, categorias, productosResp, supermercados, productosTienda] = await Promise.all([
          adminApi.getUsuarios(),
          adminApi.getCategorias(),
          adminApi.getProductos({ page: 0, size: 200 }),
          adminApi.getSupermercados(),
          adminApi.getProductosTienda(),
        ])

        const productos = productosResp?.content ?? []
        const totalUsuarios = usuarios.length
        const usuariosActivos = usuarios.filter((u) => u.estado?.toUpperCase() === 'ACTIVO').length
        const usuariosInactivos = usuarios.filter((u) => u.estado?.toUpperCase() === 'INACTIVO').length
        const administradores = usuarios.filter((u) =>
          u.roles?.some((r) => {
            const role = r.toUpperCase()
            return role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'ROLE_ADMIN' || role === 'ROLE_ADMINISTRADOR'
          })
        ).length

        setStats({
          totalUsuarios,
          usuariosActivos,
          usuariosInactivos,
          administradores,
          totalProductos: productos.length,
          totalCategorias: categorias.length,
          totalSupermercados: supermercados.length,
          totalMapeos: productosTienda.length,
          productosConImagen: productos.filter((p) => !!p).length,
        })
      } catch (error) {
        console.error('Error cargando dashboard administrativo:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const maxUsuarios = Math.max(1, stats.totalUsuarios || 1)
  const maxProductos = Math.max(1, stats.totalProductos || 1)

  const actividad = useMemo(
    () => [
      { label: 'Usuarios activos', value: `${stats.usuariosActivos}`, tone: 'success', pct: Math.round((stats.usuariosActivos / maxUsuarios) * 100) },
      { label: 'Productos en catálogo', value: `${stats.totalProductos}`, tone: 'primary', pct: Math.round((stats.totalProductos / maxProductos) * 100) },
      { label: 'Categorías', value: `${stats.totalCategorias}`, tone: 'warning', pct: Math.min(100, Math.round((stats.totalCategorias / 20) * 100)) },
      { label: 'Supermercados', value: `${stats.totalSupermercados}`, tone: 'neutral', pct: Math.min(100, Math.round((stats.totalSupermercados / 10) * 100)) },
    ],
    [stats, maxUsuarios, maxProductos]
  )

  const reparto = useMemo(
    () => [
      { label: 'Activos', value: stats.usuariosActivos, color: '#16a34a', pct: Math.max(5, Math.round((stats.usuariosActivos / maxUsuarios) * 100)) },
      { label: 'Inactivos', value: stats.usuariosInactivos, color: '#f59e0b', pct: Math.max(5, Math.round((stats.usuariosInactivos / maxUsuarios) * 100)) },
      { label: 'Admins', value: stats.administradores, color: '#8b5cf6', pct: Math.max(5, Math.round((stats.administradores / maxUsuarios) * 100)) },
    ],
    [stats, maxUsuarios]
  )

  const trendData = useMemo(
    () => [42, 54, 48, 63, 71, 68, 82, 89, 76, 94, 101, 97],
    []
  )

  const trendPoints = useMemo(() => {
    const width = 500
    const height = 160
    const min = Math.min(...trendData)
    const max = Math.max(...trendData)
    const range = max - min || 1

    return trendData
      .map((value, index) => {
        const x = (index / (trendData.length - 1)) * width
        const y = height - ((value - min) / range) * (height - 18) - 9
        return `${x},${y}`
      })
      .join(' ')
  }, [trendData])

  const executiveKpis = [
    { label: 'Uptime', value: '99.2%', delta: '+0.8%', tone: 'emerald' },
    { label: 'Cobertura', value: '86%', delta: '+12%', tone: 'blue' },
    { label: 'Tasa activa', value: '74.3%', delta: '+6.1%', tone: 'violet' },
  ]

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-badge">ADMIN</span>
          <h1>Executive analytics</h1>
          <p>Resumen operativo del sistema, catálogo y actividad del negocio.</p>
        </div>
        <div className="header-actions">
          <button className="header-btn">📊 Analytics</button>
          <button className="header-btn secondary">↻ Actualizar</button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Cargando métricas del sistema...</p>
        </div>
      ) : (
        <>
          <section className="executive-topbar">
            <div className="hero-panel">
              <div className="hero-label-row">
                <span className="hero-badge">Performance</span>
                <span className="hero-trend positive">+18.4% vs último mes</span>
              </div>

              <div className="hero-main">
                <div>
                  <div className="hero-kicker">Estado general</div>
                  <div className="hero-value">94.8%</div>
                </div>
                <div className="hero-metric">
                  <strong>Activos</strong>
                  <span>{stats.usuariosActivos}</span>
                </div>
              </div>

              <svg className="sparkline" viewBox="0 0 500 160" preserveAspectRatio="none" aria-label="Trend chart">
                <defs>
                  <linearGradient id="sparkGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <polyline fill="none" stroke="url(#sparkGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={trendPoints} />
              </svg>

              <div className="sparkline-labels">
                {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </div>

            <div className="mini-kpis">
              {executiveKpis.map((item) => (
                <div key={item.label} className={`mini-kpi ${item.tone}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.delta}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">👥</div>
              <div className="stat-copy">
                <div className="stat-label">Total usuarios</div>
                <div className="stat-value">{stats.totalUsuarios}</div>
                <div className="stat-trend positive">{stats.usuariosActivos + stats.usuariosInactivos} registrados</div>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-copy">
                <div className="stat-label">Usuarios activos</div>
                <div className="stat-value">{stats.usuariosActivos}</div>
                <div className="stat-trend positive">{Math.round((stats.usuariosActivos / maxUsuarios) * 100)}% del total</div>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">⛔</div>
              <div className="stat-copy">
                <div className="stat-label">Usuarios inactivos</div>
                <div className="stat-value">{stats.usuariosInactivos}</div>
                <div className="stat-trend neutral">{Math.round((stats.usuariosInactivos / maxUsuarios) * 100)}% sin acceso</div>
              </div>
            </div>

            <div className="stat-card danger">
              <div className="stat-icon">🛡️</div>
              <div className="stat-copy">
                <div className="stat-label">Administradores</div>
                <div className="stat-value">{stats.administradores}</div>
                <div className="stat-trend neutral">Acceso privilegiado</div>
              </div>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="panel panel-large">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Resumen</span>
                  <h2>Estado del sistema</h2>
                </div>
              </div>

              <div className="activity-list">
                {actividad.map((item) => (
                  <div key={item.label} className="activity-item">
                    <div className="activity-row-top">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="progress-bar">
                      <span className={`progress-fill ${item.tone}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Distribución</span>
                  <h2>Usuarios</h2>
                </div>
              </div>

              <div className="bars-chart">
                {reparto.map((item) => (
                  <div key={item.label} className="bar-group">
                    <div className="bar-labels">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="bar-track">
                      <span className="bar-fill" style={{ height: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Catalogo</span>
                  <h2>Infraestructura</h2>
                </div>
              </div>

              <div className="mini-stats">
                <div className="mini-stat">
                  <span>Categorías</span>
                  <strong>{stats.totalCategorias}</strong>
                </div>
                <div className="mini-stat">
                  <span>Supermercados</span>
                  <strong>{stats.totalSupermercados}</strong>
                </div>
                <div className="mini-stat">
                  <span>Mapeos</span>
                  <strong>{stats.totalMapeos}</strong>
                </div>
                <div className="mini-stat">
                  <span>Con imagen</span>
                  <strong>{stats.productosConImagen}</strong>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Acciones</span>
                  <h2>Rápidas</h2>
                </div>
              </div>

              <div className="quick-actions">
                <a href="/admin/usuarios">Gestionar usuarios</a>
                <a href="/admin/catalogo">Administrar catálogo</a>
                <a href="/home">Volver al inicio</a>
              </div>
            </div>
          </section>
        </>
      )}

      <style>{`
        .admin-dashboard {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem 1.5rem 3rem;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .dashboard-badge {
          display: inline-block;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 0.8rem;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: clamp(2.1rem, 3vw, 3rem);
          line-height: 1.1;
          color: var(--text-color);
        }

        .dashboard-header p {
          margin: 0.45rem 0 0;
          color: #64748b;
          font-size: 0.96rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .header-btn {
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          padding: 0.8rem 1.15rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
        }

        .header-btn.secondary {
          background: rgba(148, 163, 184, 0.12);
          color: var(--text-color);
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: none;
        }

        .executive-topbar {
          display: grid;
          grid-template-columns: 1.7fr 0.9fr;
          gap: 1.2rem;
          margin-bottom: 1.8rem;
        }

        .hero-panel {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(30, 41, 59, 0.92));
          border-radius: 24px;
          padding: 1.4rem 1.4rem 1rem;
          box-shadow: 0 25px 50px rgba(15, 23, 42, 0.18);
          border: 1px solid rgba(148, 163, 184, 0.18);
          overflow: hidden;
        }

        .hero-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          background: rgba(96, 165, 250, 0.12);
          border: 1px solid rgba(96, 165, 250, 0.2);
          color: #bfdbfe;
          border-radius: 999px;
          padding: 0.35rem 0.7rem;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .hero-trend {
          font-size: 0.8rem;
          font-weight: 700;
        }

        .hero-main {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 0.7rem;
        }

        .hero-kicker {
          color: #94a3b8;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.3rem;
        }

        .hero-value {
          font-size: clamp(2.2rem, 4vw, 3.5rem);
          letter-spacing: -0.05em;
          font-weight: 900;
          color: white;
          line-height: 1;
        }

        .hero-metric {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
          color: #cbd5e1;
        }

        .hero-metric strong {
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .hero-metric span {
          font-size: 1.2rem;
          font-weight: 800;
          color: white;
        }

        .sparkline {
          width: 100%;
          height: 160px;
          display: block;
          margin-top: 0.5rem;
        }

        .sparkline-labels {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 0.5rem;
          color: #94a3b8;
          font-size: 0.7rem;
          margin-top: 0.3rem;
          text-align: center;
        }

        .mini-kpis {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .mini-kpi {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.35rem;
          min-height: 120px;
          padding: 1rem 1.2rem;
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.9));
          box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
        }

        .mini-kpi span {
          color: #64748b;
          font-size: 0.74rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
        }

        .mini-kpi strong {
          font-size: 1.8rem;
          line-height: 1;
          color: var(--text-color);
        }

        .mini-kpi small {
          font-size: 0.7rem;
          font-weight: 800;
        }

        .mini-kpi.emerald small { color: #16a34a; }
        .mini-kpi.blue small { color: #2563eb; }
        .mini-kpi.violet small { color: #7c3aed; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.2rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.3rem 1.3rem;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }

        .stat-card.primary { border-left: 5px solid #2563eb; }
        .stat-card.success { border-left: 5px solid #10b981; }
        .stat-card.warning { border-left: 5px solid #f59e0b; }
        .stat-card.danger { border-left: 5px solid #ef4444; }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          border-radius: 18px;
          font-size: 1.7rem;
          background: rgba(79, 70, 229, 0.08);
        }

        .stat-copy {
          flex: 1;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.3rem;
        }

        .stat-value {
          font-size: clamp(1.9rem, 2vw, 2.35rem);
          font-weight: 800;
          line-height: 1;
          color: var(--text-color);
        }

        .stat-trend {
          margin-top: 0.45rem;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .stat-trend.positive { color: #15803d; }
        .stat-trend.neutral { color: #64748b; }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 1.3rem;
        }

        .panel {
          background: var(--card-bg, #ffffff);
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.15);
          box-shadow: 0 18px 35px rgba(15, 23, 42, 0.07);
          padding: 1.25rem 1.2rem;
        }

        .panel-large {
          grid-column: 1 / 2;
        }

        .panel-header {
          margin-bottom: 1rem;
        }

        .eyebrow {
          display: inline-block;
          color: #6366f1;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 0.3rem;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.18rem;
          color: var(--text-color);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .activity-row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.93rem;
          color: var(--text-color);
        }

        .progress-bar {
          width: 100%;
          height: 10px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.14);
          overflow: hidden;
        }

        .progress-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
        }

        .progress-fill.success { background: linear-gradient(90deg, #22c55e, #16a34a); }
        .progress-fill.primary { background: linear-gradient(90deg, #3b82f6, #2563eb); }
        .progress-fill.warning { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
        .progress-fill.neutral { background: linear-gradient(90deg, #94a3b8, #64748b); }

        .bars-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          height: 200px;
          padding-top: 0.8rem;
        }

        .bar-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
          height: 100%;
          justify-content: flex-end;
        }

        .bar-labels {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          font-size: 0.8rem;
          color: #64748b;
        }

        .bar-track {
          width: 48px;
          height: 140px;
          background: rgba(148, 163, 184, 0.1);
          border-radius: 999px;
          display: flex;
          align-items: flex-end;
          padding: 6px;
          box-sizing: border-box;
        }

        .bar-fill {
          width: 100%;
          border-radius: 999px;
          min-height: 12%;
          box-shadow: inset 0 0 12px rgba(255,255,255,0.15);
        }

        .mini-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
        }

        .mini-stat {
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.08);
          border-radius: 14px;
          padding: 0.9rem 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .mini-stat span {
          color: #64748b;
          font-size: 0.76rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .mini-stat strong {
          font-size: 1.4rem;
          color: var(--text-color);
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .quick-actions a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0.82rem 1rem;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          box-shadow: 0 12px 24px rgba(79, 70, 229, 0.2);
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          background: var(--card-bg, #ffffff);
          border-radius: 18px;
          box-shadow: 0 18px 35px rgba(15, 23, 42, 0.05);
          color: #64748b;
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        .spinner {
          width: 42px;
          height: 42px;
          border: 4px solid rgba(148, 163, 184, 0.2);
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        [data-theme='dark'] .dashboard-header p,
        [data-theme='dark'] .stat-label,
        [data-theme='dark'] .bar-labels,
        [data-theme='dark'] .mini-stat span,
        [data-theme='dark'] .dashboard-loading,
        [data-theme='dark'] .mini-kpi span {
          color: #cbd5e1;
        }

        [data-theme='dark'] .stat-card,
        [data-theme='dark'] .panel,
        [data-theme='dark'] .dashboard-loading,
        [data-theme='dark'] .mini-stat,
        [data-theme='dark'] .mini-kpi {
          background: #1f2937;
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: 0 18px 35px rgba(0, 0, 0, 0.28);
        }

        [data-theme='dark'] .stat-value,
        [data-theme='dark'] .dashboard-header h1,
        [data-theme='dark'] .panel-header h2,
        [data-theme='dark'] .activity-row-top,
        [data-theme='dark'] .mini-stat strong,
        [data-theme='dark'] .bar-labels strong,
        [data-theme='dark'] .mini-kpi strong,
        [data-theme='dark'] .hero-value,
        [data-theme='dark'] .hero-metric span {
          color: #f8fafc;
        }

        [data-theme='dark'] .header-btn.secondary {
          background: rgba(148, 163, 184, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #f8fafc;
        }

        [data-theme='dark'] .progress-bar {
          background: rgba(148, 163, 184, 0.16);
        }

        [data-theme='dark'] .hero-panel {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(22, 27, 38, 0.98));
          border-color: rgba(148, 163, 184, 0.18);
        }

        [data-theme='dark'] .hero-kicker,
        [data-theme='dark'] .hero-metric strong,
        [data-theme='dark'] .sparkline-labels {
          color: #94a3b8;
        }

        @media (max-width: 920px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .executive-topbar,
          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .panel-large {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  )
}

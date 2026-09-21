import { useState, useEffect, useMemo } from 'react';
import { adminApi, type UsuarioAdminDto, type RolAdminDto } from '../../api/adminApi';
import { useAuthStore } from '../../store/authStore';

export default function AdminUsers() {
  const currentUser = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState<UsuarioAdminDto[]>([]);
  const [roles, setRoles] = useState<RolAdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroRol, setFiltroRol] = useState<string>('TODOS');

  // Modal de creación de usuario
  const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
  const [formNuevoUsuario, setFormNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    rolId: '',
  });
  const [procesandoCreacion, setProcesandoCreacion] = useState(false);

  // Modal de confirmación de cambio de estado
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAdminDto | null>(null);
  const [nuevoEstadoPendiente, setNuevoEstadoPendiente] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al cargar el listado de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const data = await adminApi.getRoles();
      setRoles(data);
    } catch (err: any) {
      console.error('Error cargando roles:', err);
    }
  };

  const abrirCrearUsuario = () => {
    setFormNuevoUsuario({
      nombre: '',
      email: '',
      password: '',
      estado: 'ACTIVO',
      rolId: roles[0]?.id?.toString() || '',
    });
    setModalCrearUsuario(true);
    setError(null);
  };

  const confirmarCreacionUsuario = async () => {
    const nombre = formNuevoUsuario.nombre.trim();
    const email = formNuevoUsuario.email.trim();
    const password = formNuevoUsuario.password.trim();

    if (!nombre || !email || !password) {
      setError('Nombre, email y contraseña son obligatorios.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('El email no tiene un formato válido.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setProcesandoCreacion(true);
    setError(null);

    try {
      const nuevoUsuario = await adminApi.createUsuario({
        nombre,
        email,
        password,
        estado: formNuevoUsuario.estado,
      });

      if (formNuevoUsuario.rolId) {
        await adminApi.asignarRol(nuevoUsuario.id, Number(formNuevoUsuario.rolId));
      }

      setSuccessMsg(`Usuario "${nombre}" creado correctamente.`);
      setModalCrearUsuario(false);
      await cargarUsuarios();
      setFormNuevoUsuario({
        nombre: '',
        email: '',
        password: '',
        estado: 'ACTIVO',
        rolId: roles[0]?.id?.toString() || '',
      });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'No se pudo crear el usuario');
    } finally {
      setProcesandoCreacion(false);
    }
  };

  const solicitarCambioEstado = (u: UsuarioAdminDto) => {
    const estadoObjetivo = u.estado?.toUpperCase() === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setUsuarioSeleccionado(u);
    setNuevoEstadoPendiente(estadoObjetivo);
    setModalConfirmacion(true);
  };

  const confirmarCambioEstado = async () => {
    if (!usuarioSeleccionado) return;
    setProcesando(true);
    setError(null);
    try {
      await adminApi.actualizarEstadoUsuario(usuarioSeleccionado.id, nuevoEstadoPendiente);
      setSuccessMsg(
        `Estado del usuario "${usuarioSeleccionado.nombre || usuarioSeleccionado.email}" actualizado a ${nuevoEstadoPendiente} con éxito.`
      );
      setModalConfirmacion(false);
      setUsuarioSeleccionado(null);
      await cargarUsuarios();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'No se pudo actualizar el estado del usuario');
      setModalConfirmacion(false);
    } finally {
      setProcesando(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideBusqueda =
        !busqueda ||
        u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstado =
        filtroEstado === 'TODOS' || u.estado?.toUpperCase() === filtroEstado;

      const coincideRol =
        filtroRol === 'TODOS' ||
        u.roles?.some((r) => r.toUpperCase().includes(filtroRol.toUpperCase()));

      return coincideBusqueda && coincideEstado && coincideRol;
    });
  }, [usuarios, busqueda, filtroEstado, filtroRol]);

  const metricas = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter((u) => u.estado?.toUpperCase() === 'ACTIVO').length;
    const inactivos = usuarios.filter((u) => u.estado?.toUpperCase() === 'INACTIVO').length;
    const admins = usuarios.filter((u) =>
      u.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRADOR')
    ).length;
    return { total, activos, inactivos, admins };
  }, [usuarios]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <span className="admin-badge-cu">CU-09</span>
          <h1 className="admin-title">Gestión de Cuentas de Usuarios</h1>
          <p className="admin-subtitle">
            Control de estados operativos (Habilitar / Inhabilitar) y auditoría de accesos al sistema.
          </p>
        </div>
        <div className="header-actions">
          <button onClick={abrirCrearUsuario} className="btn-primary-action" title="Crear nuevo usuario">
            ➕ Nuevo usuario
          </button>
          <button onClick={cargarUsuarios} className="btn-refresh" title="Refrescar lista" disabled={loading}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">👥</span>
          <div>
            <div className="metric-value">{metricas.total}</div>
            <div className="metric-label">Total Cuentas</div>
          </div>
        </div>
        <div className="metric-card metric-card-success">
          <span className="metric-icon">✅</span>
          <div>
            <div className="metric-value">{metricas.activos}</div>
            <div className="metric-label">Cuentas Activas</div>
          </div>
        </div>
        <div className="metric-card metric-card-danger">
          <span className="metric-icon">⛔</span>
          <div>
            <div className="metric-value">{metricas.inactivos}</div>
            <div className="metric-label">Cuentas Inhabilitadas</div>
          </div>
        </div>
        <div className="metric-card metric-card-warning">
          <span className="metric-icon">🛡️</span>
          <div>
            <div className="metric-value">{metricas.admins}</div>
            <div className="metric-label">Administradores</div>
          </div>
        </div>
      </div>

      {/* Banners de Notificación */}
      {successMsg && (
        <div className="alert-banner alert-success">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert-close">✕</button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="btn-clear-search">✕</button>
          )}
        </div>

        <div className="filter-selects">
          <div className="filter-item">
            <label>Estado:</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="select-input">
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Activos (Habilitados)</option>
              <option value="INACTIVO">Inactivos (Inhabilitados)</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Rol:</label>
            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className="select-input">
              <option value="TODOS">Todos los roles</option>
              <option value="ADMIN">Administradores</option>
              <option value="USER">Usuarios estándar</option>
              <option value="SCRAPER">Scraper</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando cuentas de usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            <p>No se encontraron cuentas con los criterios de búsqueda seleccionados.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Roles Asignados</th>
                <th>Estado Operativo</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => {
                const esUsuarioActual = currentUser?.id === u.id || currentUser?.email === u.email;
                const estaActivo = u.estado?.toUpperCase() === 'ACTIVO';

                return (
                  <tr key={u.id} className={!estaActivo ? 'row-inactive' : ''}>
                    <td className="cell-id">#{u.id}</td>
                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {u.nombre ? u.nombre.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-cell-info">
                          <span className="user-cell-name">{u.nombre || 'Sin nombre'}</span>
                          {esUsuarioActual && <span className="you-badge">(Tu cuenta)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="cell-email">{u.email}</td>
                    <td>
                      <div className="roles-list">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r, idx) => (
                            <span
                              key={idx}
                              className={`role-badge ${
                                r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRADOR'
                                  ? 'role-admin'
                                  : 'role-user'
                              }`}
                            >
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="role-badge role-none">Sin rol</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${estaActivo ? 'status-active' : 'status-inactive'}`}>
                        <span className="status-dot"></span>
                        {estaActivo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => solicitarCambioEstado(u)}
                        disabled={esUsuarioActual && estaActivo}
                        title={
                          esUsuarioActual && estaActivo
                            ? 'No podés inhabilitar tu propia cuenta de administrador en sesión'
                            : estaActivo
                            ? 'Inhabilitar acceso a esta cuenta'
                            : 'Habilitar acceso a esta cuenta'
                        }
                        className={`btn-action-status ${estaActivo ? 'btn-deactivate' : 'btn-activate'}`}
                      >
                        {estaActivo ? '⛔ Inhabilitar' : '✅ Habilitar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalCrearUsuario && (
        <div className="modal-overlay" onClick={() => !procesandoCreacion && setModalCrearUsuario(false)}>
          <div className="modal-card modal-crear-usuario" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">👤</span>
              <h3>Crear nuevo usuario</h3>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Nombre completo</label>
                <input
                  type="text"
                  value={formNuevoUsuario.nombre}
                  onChange={(e) => setFormNuevoUsuario((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="form-input"
                  placeholder="Ej: Ana López"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  value={formNuevoUsuario.email}
                  onChange={(e) => setFormNuevoUsuario((prev) => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  value={formNuevoUsuario.password}
                  onChange={(e) => setFormNuevoUsuario((prev) => ({ ...prev, password: e.target.value }))}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rol asignado</label>
                <select
                  value={formNuevoUsuario.rolId}
                  onChange={(e) => setFormNuevoUsuario((prev) => ({ ...prev, rolId: e.target.value }))}
                  className="form-input"
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id.toString()}>
                      {rol.nombreRol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  value={formNuevoUsuario.estado}
                  onChange={(e) =>
                    setFormNuevoUsuario((prev) => ({
                      ...prev,
                      estado: e.target.value as 'ACTIVO' | 'INACTIVO',
                    }))
                  }
                  className="form-input"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setModalCrearUsuario(false)} disabled={procesandoCreacion}>
                Cancelar
              </button>
              <button type="button" className="btn-modal-confirm btn-modal-success" onClick={confirmarCreacionUsuario} disabled={procesandoCreacion}>
                {procesandoCreacion ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cambio de Estado */}
      {modalConfirmacion && usuarioSeleccionado && (
        <div className="modal-overlay" onClick={() => !procesando && setModalConfirmacion(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">
                {nuevoEstadoPendiente === 'INACTIVO' ? '⚠️' : '✨'}
              </span>
              <h3>Confirmar Modificación de Estado</h3>
            </div>

            <div className="modal-body">
              <p>
                ¿Estás seguro de que deseas cambiar el estado operativo del usuario{' '}
                <strong>{usuarioSeleccionado.nombre || usuarioSeleccionado.email}</strong>?
              </p>
              <div className="state-transition-card">
                <div className="transition-step">
                  <span className="step-label">Estado Actual:</span>
                  <span className={`status-pill ${usuarioSeleccionado.estado === 'ACTIVO' ? 'status-active' : 'status-inactive'}`}>
                    {usuarioSeleccionado.estado}
                  </span>
                </div>
                <span className="transition-arrow">➔</span>
                <div className="transition-step">
                  <span className="step-label">Nuevo Estado:</span>
                  <span className={`status-pill ${nuevoEstadoPendiente === 'ACTIVO' ? 'status-active' : 'status-inactive'}`}>
                    {nuevoEstadoPendiente}
                  </span>
                </div>
              </div>

              {nuevoEstadoPendiente === 'INACTIVO' && (
                <div className="warning-notice">
                  ℹ️ El usuario no podrá iniciar sesión en la plataforma mientras su cuenta permanezca inactiva.
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setModalConfirmacion(false)}
                className="btn-modal-cancel"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCambioEstado}
                className={`btn-modal-confirm ${nuevoEstadoPendiente === 'INACTIVO' ? 'btn-modal-danger' : 'btn-modal-success'}`}
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : `Sí, cambiar a ${nuevoEstadoPendiente}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 2rem 1.5rem 3rem;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          flex-wrap: wrap;
        }

        .btn-primary-action {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          border: none;
          padding: 0.75rem 1.1rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 12px 20px rgba(79, 70, 229, 0.18);
        }

        .admin-badge-cu {
          display: inline-block;
          background: linear-gradient(135deg, #4f46e5, #8b5cf6);
          color: white;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          margin-bottom: 0.65rem;
          letter-spacing: 0.06em;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.22);
        }

        .admin-title {
          font-size: clamp(1.8rem, 2.8vw, 2.6rem);
          font-weight: 800;
          color: var(--text-color);
          margin: 0 0 0.45rem 0;
          line-height: 1.15;
        }

        .admin-subtitle {
          color: #64748b;
          margin: 0;
          font-size: 0.96rem;
          max-width: 720px;
        }

        .btn-refresh {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          border: none;
          padding: 0.75rem 1.1rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, filter 0.2s ease;
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.18);
        }

        .btn-refresh:hover:not(:disabled) {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.2rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9));
          border-radius: 18px;
          padding: 1.25rem 1.3rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 18px 30px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }

        .metric-card-success { border-left: 5px solid #10b981; }
        .metric-card-danger { border-left: 5px solid #ef4444; }
        .metric-card-warning { border-left: 5px solid #f59e0b; }

        .metric-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          background: rgba(79, 70, 229, 0.08);
        }

        .metric-value {
          font-size: clamp(1.7rem, 2vw, 2.2rem);
          font-weight: 800;
          color: var(--text-color);
          line-height: 1.08;
        }

        .metric-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .alert-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem 1.2rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .alert-success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: inherit;
        }

        .filters-bar {
          background: var(--card-bg, #ffffff);
          padding: 1.25rem;
          border-radius: 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 1.1rem;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          box-shadow: 0 18px 30px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .search-box {
          display: flex;
          align-items: center;
          background: rgba(148, 163, 184, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 12px;
          padding: 0.55rem 0.9rem;
          flex: 1;
          min-width: 280px;
        }

        .search-icon {
          margin-right: 0.55rem;
          color: #94a3b8;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.92rem;
          color: #1f2937;
        }

        .btn-clear-search {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
        }

        .filter-selects {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 0.9rem;
          font-weight: 700;
          color: #475569;
        }

        .select-input {
          padding: 0.58rem 0.8rem;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: white;
          font-size: 0.9rem;
          color: #1f2937;
          outline: none;
        }

        .table-wrapper {
          background: var(--card-bg, #ffffff);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 18px 30px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.16);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .admin-table th {
          background: #f8fafc;
          padding: 1rem 1.25rem;
          font-size: 0.8rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #e2e8f0;
        }

        .admin-table td {
          padding: 1.05rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.92rem;
          color: #334155;
          vertical-align: middle;
        }

        .admin-table tbody tr:hover {
          background: #f8fafc;
        }

        .row-inactive {
          background: rgba(148, 163, 184, 0.04);
          opacity: 0.92;
        }

        .cell-id {
          font-weight: 700;
          color: #94a3b8;
          font-family: monospace;
        }

        .cell-email {
          font-family: monospace;
          font-size: 0.88rem;
          color: #475569;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .table-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dbeafe, #e0e7ff);
          color: #4338ca;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.95rem;
        }

        .user-cell-info {
          display: flex;
          flex-direction: column;
        }

        .user-cell-name {
          font-weight: 700;
          color: #1e293b;
        }

        .you-badge {
          font-size: 0.72rem;
          color: #6366f1;
          font-weight: 700;
        }

        .roles-list {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .role-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
        }

        .role-admin {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }

        .role-user {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }

        .role-none {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.28rem 0.72rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .status-active {
          background: #dcfce7;
          color: #15803d;
        }

        .status-active .status-dot {
          background: #22c55e;
        }

        .status-inactive {
          background: #fee2e2;
          color: #b91c1c;
        }

        .status-inactive .status-dot {
          background: #ef4444;
        }

        .btn-action-status {
          padding: 0.5rem 0.9rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.15s ease;
        }

        .btn-deactivate {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
        }

        .btn-deactivate:hover:not(:disabled) {
          background: #fca5a5;
          color: #7f1d1d;
        }

        .btn-activate {
          background: #dcfce7;
          color: #16a34a;
          border: 1px solid #86efac;
        }

        .btn-activate:hover:not(:disabled) {
          background: #86efac;
          color: #14532d;
        }

        .btn-action-status:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .loading-state,
        .empty-state {
          padding: 3.5rem;
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(3px);
        }

        .modal-card {
          background: white;
          border-radius: 18px;
          width: 100%;
          max-width: 500px;
          padding: 1.8rem;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
        }

        .modal-crear-usuario {
          max-width: 560px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.2rem;
        }

        .modal-icon {
          font-size: 1.8rem;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 800;
          color: #1e293b;
        }

        .modal-body {
          font-size: 0.95rem;
          color: #475569;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .state-transition-card {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          margin: 1rem 0;
          border: 1px solid #e2e8f0;
        }

        .transition-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
        }

        .step-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
        }

        .transition-arrow {
          font-size: 1.3rem;
          color: #94a3b8;
        }

        .warning-notice {
          background: #fffbeb;
          color: #92400e;
          padding: 0.8rem;
          border-radius: 10px;
          font-size: 0.85rem;
          border: 1px solid #fde68a;
          margin-top: 1rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 0.8rem;
          font-weight: 800;
          color: #334155;
        }

        .form-input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.7rem 0.8rem;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: white;
          color: #1f2937;
          font-size: 0.9rem;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .btn-modal-cancel {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 0.7rem 1.2rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-modal-confirm {
          border: none;
          padding: 0.7rem 1.35rem;
          border-radius: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .btn-modal-danger { background: #dc2626; color: white; }
        .btn-modal-danger:hover { background: #b91c1c; }
        .btn-modal-success { background: #16a34a; color: white; }
        .btn-modal-success:hover { background: #15803d; }

        [data-theme='dark'] .admin-subtitle,
        [data-theme='dark'] .metric-label,
        [data-theme='dark'] .filter-item,
        [data-theme='dark'] .step-label,
        [data-theme='dark'] .loading-state,
        [data-theme='dark'] .empty-state {
          color: #cbd5e1;
        }

        [data-theme='dark'] .metric-card,
        [data-theme='dark'] .filters-bar,
        [data-theme='dark'] .table-wrapper,
        [data-theme='dark'] .modal-card {
          background: #1f2937;
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: 0 18px 30px rgba(0, 0, 0, 0.28);
        }

        [data-theme='dark'] .metric-value,
        [data-theme='dark'] .admin-title,
        [data-theme='dark'] .user-cell-name,
        [data-theme='dark'] .modal-header h3,
        [data-theme='dark'] .search-input,
        [data-theme='dark'] .select-input,
        [data-theme='dark'] .admin-table td {
          color: #f8fafc;
        }

        [data-theme='dark'] .search-box {
          background: rgba(148, 163, 184, 0.08);
          border-color: rgba(148, 163, 184, 0.16);
        }

        [data-theme='dark'] .select-input,
        [data-theme='dark'] .btn-modal-cancel {
          background: #2a2a2a;
          border-color: rgba(148, 163, 184, 0.2);
          color: #f8fafc;
        }

        [data-theme='dark'] .admin-table th {
          background: #262626;
          color: #94a3b8;
          border-bottom: 1px solid #333333;
        }

        [data-theme='dark'] .admin-table td {
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }

        [data-theme='dark'] .admin-table tbody tr:hover {
          background: rgba(148, 163, 184, 0.06);
        }

        [data-theme='dark'] .row-inactive {
          background: rgba(148, 163, 184, 0.04);
        }

        [data-theme='dark'] .table-avatar {
          background: linear-gradient(135deg, #1d4ed8, #4f46e5);
          color: #dbeafe;
        }

        [data-theme='dark'] .state-transition-card {
          background: #262626;
          border-color: #333333;
        }

        [data-theme='dark'] .warning-notice {
          background: #451a03;
          color: #fde68a;
          border-color: #78350f;
        }
      `}</style>
    </div>
  );
}

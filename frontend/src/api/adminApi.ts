import api from './axios';
import type { ApiResponse } from '../types/Supermercado';

export interface UsuarioAdminDto {
  id: number;
  email: string;
  nombre: string;
  estado: string;
  roles: string[];
}

export interface RolAdminDto {
  id: number;
  nombreRol: string;
}

export interface CategoriaAdminDto {
  id: number;
  nombre: string;
}

export interface ProductoAdminDto {
  id: number;
  nombreGenerico: string;
  marca?: string;
  varianteEspecifica?: string;
  pesoValor?: number;
  pesoUnidad?: string;
  categoriaId: number;
  categoriaNombre?: string;
}

export interface ProductoTiendaAdminDto {
  id: number;
  productoId: number;
  productoNombre?: string;
  productoMarca?: string;
  supermercadoId: number;
  supermercadoNombre?: string;
  supermercadoUrlBase?: string;
  urlEspecifica?: string;
  codigoExterno?: string;
  urlImagen?: string;
}

export interface CriterioBusquedaAdminDto {
  id: number;
  terminoBusqueda: string;
  categoriaId: number;
  categoriaNombre?: string;
}

export interface SupermercadoAdminDto {
  id: number;
  nombre: string;
  urlBase: string;
}

export const adminApi = {
  // ─── Gestión de Usuarios (CU-09) ──────────────────────────────────────────
  getUsuarios: async (): Promise<UsuarioAdminDto[]> => {
    const res = await api.get<ApiResponse<UsuarioAdminDto[]>>('/usuarios');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  actualizarEstadoUsuario: async (id: number, estado: 'ACTIVO' | 'INACTIVO'): Promise<UsuarioAdminDto> => {
    const res = await api.patch<ApiResponse<UsuarioAdminDto>>(`/usuarios/${id}/estado`, { estado });
    return res.data?.data;
  },

  getRoles: async (): Promise<RolAdminDto[]> => {
    const res = await api.get<ApiResponse<RolAdminDto[]>>('/usuarios/roles');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  asignarRol: async (usuarioId: number, rolId: number): Promise<UsuarioAdminDto> => {
    const res = await api.post<ApiResponse<UsuarioAdminDto>>('/usuarios/asignar/roles', { usuarioId, rolId });
    return res.data?.data;
  },

  // ─── Categorías (CU-10) ──────────────────────────────────────────────────
  getCategorias: async (): Promise<CategoriaAdminDto[]> => {
    const res = await api.get<ApiResponse<CategoriaAdminDto[]>>('/categorias');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  crearCategoria: async (nombre: string): Promise<CategoriaAdminDto> => {
    const res = await api.post<ApiResponse<CategoriaAdminDto>>('/categorias', { nombre });
    return res.data?.data;
  },

  actualizarCategoria: async (id: number, nombre: string): Promise<CategoriaAdminDto> => {
    const res = await api.put<ApiResponse<CategoriaAdminDto>>(`/categorias/${id}`, { nombre });
    return res.data?.data;
  },

  eliminarCategoria: async (id: number): Promise<void> => {
    await api.delete(`/categorias/${id}`);
  },

  // ─── Productos Maestros (CU-10) ──────────────────────────────────────────
  getProductos: async (params?: { nombre?: string; marca?: string; categoriaId?: number; page?: number; size?: number }) => {
    const qp = new URLSearchParams();
    if (params?.nombre) qp.append('nombre', params.nombre);
    if (params?.marca) qp.append('marca', params.marca);
    if (params?.categoriaId) qp.append('categoriaId', params.categoriaId.toString());
    if (params?.page !== undefined) qp.append('page', params.page.toString());
    if (params?.size !== undefined) qp.append('size', params.size.toString());

    const res = await api.get<ApiResponse<{ content: ProductoAdminDto[]; totalElements: number; totalPages: number }>>('/productos', {
      params: qp,
    });
    return res.data?.data;
  },

  crearProducto: async (dto: Omit<ProductoAdminDto, 'id' | 'categoriaNombre'>): Promise<ProductoAdminDto> => {
    const res = await api.post<ApiResponse<ProductoAdminDto>>('/productos', dto);
    return res.data?.data;
  },

  actualizarProducto: async (id: number, dto: Omit<ProductoAdminDto, 'id' | 'categoriaNombre'>): Promise<ProductoAdminDto> => {
    const res = await api.put<ApiResponse<ProductoAdminDto>>(`/productos/${id}`, dto);
    return res.data?.data;
  },

  eliminarProducto: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}`);
  },

  // ─── Mapeos Producto - Supermercado (CU-10) ──────────────────────────────
  getProductosTienda: async (): Promise<ProductoTiendaAdminDto[]> => {
    const res = await api.get<ApiResponse<ProductoTiendaAdminDto[]>>('/productos-tienda');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  getProductosTiendaByProducto: async (productoId: number): Promise<ProductoTiendaAdminDto[]> => {
    const res = await api.get<ApiResponse<ProductoTiendaAdminDto[]>>(`/productos-tienda/producto/${productoId}`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  crearProductoTienda: async (dto: {
    productoId: number;
    supermercadoId: number;
    urlEspecifica?: string;
    codigoExterno?: string;
    urlImagen?: string;
  }): Promise<ProductoTiendaAdminDto> => {
    const res = await api.post<ApiResponse<ProductoTiendaAdminDto>>('/productos-tienda', dto);
    return res.data?.data;
  },

  actualizarProductoTienda: async (
    id: number,
    dto: {
      productoId: number;
      supermercadoId: number;
      urlEspecifica?: string;
      codigoExterno?: string;
      urlImagen?: string;
    }
  ): Promise<ProductoTiendaAdminDto> => {
    const res = await api.put<ApiResponse<ProductoTiendaAdminDto>>(`/productos-tienda/${id}`, dto);
    return res.data?.data;
  },

  eliminarProductoTienda: async (id: number): Promise<void> => {
    await api.delete(`/productos-tienda/${id}`);
  },

  // ─── Supermercados ────────────────────────────────────────────────────────
  getSupermercados: async (): Promise<SupermercadoAdminDto[]> => {
    const res = await api.get<ApiResponse<SupermercadoAdminDto[]>>('/supermercados');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // ─── Criterios de Búsqueda para Scraper ──────────────────────────────────
  getCriteriosBusqueda: async (): Promise<CriterioBusquedaAdminDto[]> => {
    const res = await api.get<ApiResponse<CriterioBusquedaAdminDto[]>>('/criterios-busqueda');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  crearCriterioBusqueda: async (dto: { terminoBusqueda: string; categoriaId: number }): Promise<CriterioBusquedaAdminDto> => {
    const res = await api.post<ApiResponse<CriterioBusquedaAdminDto>>('/criterios-busqueda', dto);
    return res.data?.data;
  },

  actualizarCriterioBusqueda: async (id: number, dto: { terminoBusqueda: string; categoriaId: number }): Promise<CriterioBusquedaAdminDto> => {
    const res = await api.put<ApiResponse<CriterioBusquedaAdminDto>>(`/criterios-busqueda/${id}`, dto);
    return res.data?.data;
  },

  eliminarCriterioBusqueda: async (id: number): Promise<void> => {
    await api.delete(`/criterios-busqueda/${id}`);
  },
};

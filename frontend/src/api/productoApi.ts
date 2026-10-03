import axiosInstance from './axios'
import type { ProductoBusqueda, ApiResponse } from '../types/Supermercado'

const buildImageUrl = (fallback?: string) => {
  if (fallback) return fallback
  return undefined
}

const normalizeProducto = (raw: any): ProductoBusqueda => ({
  id: Number(raw?.id ?? raw?.productoId ?? raw?.productoMaestroId ?? 0),
  nombreGenerico: raw?.nombreGenerico ?? raw?.nombre ?? 'Producto sin nombre',
  marca: raw?.marca ?? 'Sin marca',
  precio: Number(raw?.precio ?? raw?.precioActual ?? 0),
  urlImagen: buildImageUrl(raw?.urlImagen),
  nombreSupermercado: raw?.supermercado ?? raw?.nombreSupermercado ?? raw?.supermercadoNombre ?? 'Sin supermercado',
  descripcion: raw?.descripcion ?? null,
  categoria: raw?.categoria ?? undefined,
  pesoValor: raw?.pesoValor ?? undefined,
  pesoUnidad: raw?.pesoUnidad ?? undefined,
  varianteEspecifica: raw?.varianteEspecifica ?? undefined,
  urlEspecifica: raw?.urlEspecifica ?? undefined,
})

export const productoApi = {
  buscar: async (nombre?: string, supermercadoId?: number): Promise<ProductoBusqueda[]> => {
    const params = new URLSearchParams()
    if (nombre) params.append('q', nombre)
    if (supermercadoId) params.append('supermercadoId', supermercadoId.toString())

    const response = await axiosInstance.get<ApiResponse<any>>('/productos/busqueda', { params })
    // El endpoint /busqueda devuelve un objeto Page; los resultados estan en .data.content
    const data = Array.isArray(response.data?.data?.content) ? response.data.data.content : []
    return data.map(normalizeProducto).filter((p: ProductoBusqueda) => p.id > 0 || p.nombreGenerico !== 'Producto sin nombre')
  },

  obtenerComparativos: async (): Promise<any[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>('/productos/comparativo/todos')
    return Array.isArray(response.data?.data) ? response.data.data : []
  },
}
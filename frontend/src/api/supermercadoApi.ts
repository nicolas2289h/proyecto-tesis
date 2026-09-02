import axiosInstance from './axios'
import type { Supermercado, ApiResponse } from '../types/Supermercado'

export const supermercadoApi = {
  getAll: async (): Promise<Supermercado[]> => {
    const response = await axiosInstance.get<ApiResponse<any[]>>('/supermercados')
    const data = Array.isArray(response.data?.data) ? response.data.data : []
    return data.map((raw) => ({
      id: Number(raw?.id ?? 0),
      nombre: raw?.nombre ?? 'Supermercado',
      urlBase: raw?.urlBase ?? undefined,
    })).filter(s => s.id > 0)
  },
}

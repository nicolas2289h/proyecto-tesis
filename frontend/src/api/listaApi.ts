import axiosInstance from './axios'
import type { ApiResponse, ListaCompra, ListaCompraDetalle, ItemLista, OptimizacionCompra } from '../types/Supermercado'

export const listaApi = {
  getAll: async (): Promise<ListaCompraDetalle[]> => {
    const response = await axiosInstance.get<ApiResponse<ListaCompraDetalle[]>>('/listas')
    return response.data.data
  },

  getById: async (id: number): Promise<ListaCompraDetalle> => {
    const response = await axiosInstance.get<ApiResponse<ListaCompraDetalle>>(`/listas/${id}`)
    return response.data.data
  },

  create: async (nombreLista: string, favorita: boolean): Promise<ListaCompra> => {
    const response = await axiosInstance.post<ApiResponse<ListaCompra>>('/listas', { nombreLista, favorita })
    return response.data.data
  },

  update: async (id: number, nombreLista: string, favorita: boolean): Promise<ListaCompra> => {
    const response = await axiosInstance.put<ApiResponse<ListaCompra>>(`/listas/${id}`, { nombreLista, favorita })
    return response.data.data
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/listas/${id}`)
  },

  toggleFavorita: async (id: number): Promise<ListaCompra> => {
    const response = await axiosInstance.patch<ApiResponse<ListaCompra>>(`/listas/${id}/favorita`)
    return response.data.data
  },

  addItem: async (listaId: number, productoId: number, cantidad: number): Promise<ItemLista> => {
    const response = await axiosInstance.post<ApiResponse<ItemLista>>(
      `/listas/${listaId}/items`,
      { productoId, cantidad }
    )
    return response.data.data
  },

  getItems: async (listaId: number): Promise<ItemLista[]> => {
    const response = await axiosInstance.get<ApiResponse<ItemLista[]>>(`/listas/${listaId}/items`)
    return response.data.data
  },

  updateItem: async (listaId: number, itemId: number, productoId: number, cantidad: number): Promise<ItemLista> => {
    const response = await axiosInstance.put<ApiResponse<ItemLista>>(
      `/listas/${listaId}/items/${itemId}`,
      { productoId, cantidad }
    )
    return response.data.data
  },

  removeItem: async (listaId: number, itemId: number): Promise<void> => {
    await axiosInstance.delete<ApiResponse<void>>(`/listas/${listaId}/items/${itemId}`)
  },

  getCircuitoOptimo: async (id: number): Promise<OptimizacionCompra> => {
    const response = await axiosInstance.get<ApiResponse<OptimizacionCompra>>(`/listas/${id}/circuito-optimo`)
    return response.data.data
  },
}

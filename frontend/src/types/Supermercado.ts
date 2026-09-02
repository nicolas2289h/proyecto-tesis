export interface Supermercado {
  id: number
  nombre: string
  urlBase?: string
}

export interface ProductoBusqueda {
  id: number
  nombreGenerico: string
  marca: string
  precio: number
  urlImagen?: string
  nombreSupermercado: string
  descripcion?: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ListaCompra {
  id: number
  nombreLista: string
  fechaCreacion: string
  favorita: boolean
}

export interface ItemLista {
  id: number
  productoId: number
  productoNombre: string
  marca: string
  cantidad: number
  precioUnitario: number
  precioTotal: number
  supermercadoNombre: string
}

export interface ListaCompraDetalle extends ListaCompra {
  items: ItemLista[]
  totalEstimado: number
}

export interface ProductoOptimo {
  productoId: number
  productoNombre: string
  marca: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface TiendaOptima {
  supermercadoId: number
  supermercadoNombre: string
  productos: ProductoOptimo[]
  subtotalTienda: number
}

export interface OptimizacionCompra {
  listaId: number
  nombreLista: string
  totalOptimo: number
  totalMasCaro: number
  totalAhorrado: number
  hojaDeRuta: TiendaOptima[]
  productosSinPrecio: ProductoOptimo[]
}

package com.tesis.demo.service;

import com.tesis.demo.model.Producto;
import com.tesis.demo.model.ProductoTienda;
import com.tesis.demo.repository.CategoriaRepository;
import com.tesis.demo.repository.HistorialPrecioRepository;
import com.tesis.demo.repository.ItemListaRepository;
import com.tesis.demo.repository.ProductoRepository;
import com.tesis.demo.repository.ProductoTiendaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoServiceDeleteTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private ProductoTiendaRepository productoTiendaRepository;

    @Mock
    private HistorialPrecioRepository historialPrecioRepository;

    @Mock
    private ItemListaRepository itemListaRepository;

    @InjectMocks
    private ProductoServiceImpl productoService;

    @Test
    void eliminar_debeBorrarDependenciasAntesDelProductoMaestro() {
        Producto producto = new Producto();
        producto.setId(1L);
        producto.setNombreGenerico("Leche");

        ProductoTienda productoTienda = new ProductoTienda();
        productoTienda.setId(99L);
        productoTienda.setProducto(producto);

        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));
        when(productoTiendaRepository.findByProductoId(1L)).thenReturn(List.of(productoTienda));

        productoService.eliminar(1L);

        InOrder inOrder = inOrder(productoTiendaRepository, historialPrecioRepository, productoTiendaRepository, itemListaRepository, productoRepository);
        inOrder.verify(productoTiendaRepository).findByProductoId(1L);
        inOrder.verify(historialPrecioRepository).deleteByProductoTiendaId(99L);
        inOrder.verify(productoTiendaRepository).deleteAll(anyList());
        inOrder.verify(itemListaRepository).deleteByProductoId(1L);
        inOrder.verify(productoRepository).delete(producto);

        verify(productoTiendaRepository).findByProductoId(1L);
        verify(historialPrecioRepository).deleteByProductoTiendaId(99L);
        verify(productoTiendaRepository).deleteAll(List.of(productoTienda));
        verify(itemListaRepository).deleteByProductoId(1L);
        verify(productoRepository).delete(producto);
    }
}

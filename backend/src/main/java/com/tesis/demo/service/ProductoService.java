package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoBusquedaDto;
import com.tesis.demo.dto.ProductoComparativoDto;
import com.tesis.demo.dto.ProductoDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductoService {
    ProductoDto crear(ProductoDto dto);
    ProductoDto obtenerPorId(Long id);
    Page<ProductoDto> buscar(String nombre, String marca, Long categoriaId, Pageable pageable);
    Page<ProductoBusquedaDto> buscarConPrecios(String query, String marca, Long supermercadoId, Pageable pageable);
    List<String> obtenerMarcasDisponibles(String query, Long supermercadoId);
    ProductoDto actualizar(Long id, ProductoDto dto);
    void eliminar(Long id);
    void eliminarMasivo(List<Long> ids);
    List<ProductoComparativoDto> obtenerProductosComparativos();
}

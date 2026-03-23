package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoTiendaDto;
import java.util.List;

public interface ProductoTiendaService {
    List<ProductoTiendaDto> findAll();
    ProductoTiendaDto findById(Long id);
    List<ProductoTiendaDto> findByProductoId(Long productoId);
    List<ProductoTiendaDto> findBySupermercadoId(Long supermercadoId);
    ProductoTiendaDto save(ProductoTiendaDto productoTiendaDto);
    ProductoTiendaDto update(Long id, ProductoTiendaDto productoTiendaDto);
    void delete(Long id);
}

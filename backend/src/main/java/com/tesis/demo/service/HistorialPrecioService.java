package com.tesis.demo.service;

import com.tesis.demo.dto.HistorialPrecioCreateDto;
import com.tesis.demo.dto.HistorialPrecioDto;

import java.util.List;
import java.util.Optional;

public interface HistorialPrecioService {
    HistorialPrecioDto registrar(HistorialPrecioCreateDto dto);
    HistorialPrecioDto obtenerPorId(Long id);
    List<HistorialPrecioDto> listarTodos();
    List<HistorialPrecioDto> listarPorProductoTienda(Long productoTiendaId);
    HistorialPrecioDto obtenerUltimoPorProductoTienda(Long productoTiendaId);
    Optional<HistorialPrecioDto> obtenerUltimoPorProductoMaestro(Long productoId);
}

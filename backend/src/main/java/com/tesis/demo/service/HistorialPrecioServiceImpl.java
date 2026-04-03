package com.tesis.demo.service;

import com.tesis.demo.dto.HistorialPrecioCreateDto;
import com.tesis.demo.dto.HistorialPrecioDto;
import com.tesis.demo.model.HistorialPrecio;
import com.tesis.demo.model.ProductoTienda;
import com.tesis.demo.repository.HistorialPrecioRepository;
import com.tesis.demo.repository.ProductoTiendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistorialPrecioServiceImpl implements HistorialPrecioService {

    private final HistorialPrecioRepository historialPrecioRepository;
    private final ProductoTiendaRepository productoTiendaRepository;

    @Override
    @Transactional
    public HistorialPrecioDto registrar(HistorialPrecioCreateDto dto) {
        ProductoTienda productoTienda = productoTiendaRepository.findById(dto.getProductoTiendaId())
                .orElseThrow(() -> new RuntimeException("ProductoTienda no encontrado"));

        HistorialPrecio historialPrecio = new HistorialPrecio();
        historialPrecio.setProductoTienda(productoTienda);
        historialPrecio.setPrecio(dto.getPrecio());
        historialPrecio.setFechaRecoleccion(dto.getFechaRecoleccion() != null ? dto.getFechaRecoleccion() : LocalDateTime.now());

        return mapToDto(historialPrecioRepository.save(historialPrecio));
    }

    @Override
    @Transactional(readOnly = true)
    public HistorialPrecioDto obtenerPorId(Long id) {
        return historialPrecioRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Registro de precio no encontrado con ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistorialPrecioDto> listarTodos() {
        return historialPrecioRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistorialPrecioDto> listarPorProductoTienda(Long productoTiendaId) {
        return historialPrecioRepository.findByProductoTiendaIdOrderByFechaRecoleccionDesc(productoTiendaId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public HistorialPrecioDto obtenerUltimoPorProductoTienda(Long productoTiendaId) {
        return historialPrecioRepository.findTopByProductoTiendaIdOrderByFechaRecoleccionDesc(productoTiendaId)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("No hay precios registrados para este producto_tienda"));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<HistorialPrecioDto> obtenerUltimoPorProductoMaestro(Long productoId) {
        List<ProductoTienda> productosTienda = productoTiendaRepository.findByProductoId(productoId);
        if (productosTienda.isEmpty()) {
            return Optional.empty();
        }

        return productosTienda.stream()
                .map(pt -> historialPrecioRepository.findTopByProductoTiendaIdOrderByFechaRecoleccionDesc(pt.getId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .max(Comparator.comparing(HistorialPrecio::getFechaRecoleccion))
                .map(this::mapToDto);
    }

    private HistorialPrecioDto mapToDto(HistorialPrecio historialPrecio) {
        return new HistorialPrecioDto(
                historialPrecio.getId(),
                historialPrecio.getProductoTienda().getId(),
                historialPrecio.getProductoTienda().getProducto().getId(),
                historialPrecio.getProductoTienda().getProducto().getNombreGenerico(),
                historialPrecio.getProductoTienda().getSupermercado().getId(),
                historialPrecio.getProductoTienda().getSupermercado().getNombre(),
                historialPrecio.getPrecio(),
                historialPrecio.getFechaRecoleccion()
        );
    }
}

package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoTiendaDto;
import com.tesis.demo.model.Producto;
import com.tesis.demo.model.ProductoTienda;
import com.tesis.demo.model.Supermercado;
import com.tesis.demo.repository.ProductoRepository;
import com.tesis.demo.repository.ProductoTiendaRepository;
import com.tesis.demo.repository.SupermercadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoTiendaServiceImpl implements ProductoTiendaService {

    private final ProductoTiendaRepository productoTiendaRepository;
    private final ProductoRepository productoRepository;
    private final SupermercadoRepository supermercadoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProductoTiendaDto> findAll() {
        return productoTiendaRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoTiendaDto findById(Long id) {
        return productoTiendaRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("ProductoTienda no encontrado con ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoTiendaDto> findByProductoId(Long productoId) {
        return productoTiendaRepository.findByProductoId(productoId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoTiendaDto> findBySupermercadoId(Long supermercadoId) {
        return productoTiendaRepository.findBySupermercadoId(supermercadoId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductoTiendaDto save(ProductoTiendaDto dto) {
        productoTiendaRepository.findByProductoIdAndSupermercadoId(dto.getProductoId(), dto.getSupermercadoId())
                .ifPresent(existing -> {
                    throw new RuntimeException("Este producto ya está mapeado para este supermercado");
                });

        Producto producto = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto maestro no encontrado"));
        
        Supermercado supermercado = supermercadoRepository.findById(dto.getSupermercadoId())
                .orElseThrow(() -> new RuntimeException("Supermercado no encontrado"));

        ProductoTienda pt = new ProductoTienda();
        pt.setProducto(producto);
        pt.setSupermercado(supermercado);
        pt.setUrlEspecifica(dto.getUrlEspecifica());
        pt.setCodigoExterno(dto.getCodigoExterno());
        
        return mapToDto(productoTiendaRepository.save(pt));
    }

    @Override
    @Transactional
    public ProductoTiendaDto update(Long id, ProductoTiendaDto dto) {
        ProductoTienda pt = productoTiendaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ProductoTienda no encontrado"));

        Producto producto = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new RuntimeException("Producto maestro no encontrado"));
        
        Supermercado supermercado = supermercadoRepository.findById(dto.getSupermercadoId())
                .orElseThrow(() -> new RuntimeException("Supermercado no encontrado"));

        pt.setProducto(producto);
        pt.setSupermercado(supermercado);
        pt.setUrlEspecifica(dto.getUrlEspecifica());
        pt.setCodigoExterno(dto.getCodigoExterno());
        
        return mapToDto(productoTiendaRepository.save(pt));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!productoTiendaRepository.existsById(id)) {
            throw new RuntimeException("ProductoTienda no encontrado con ID: " + id);
        }
        productoTiendaRepository.deleteById(id);
    }

    private ProductoTiendaDto mapToDto(ProductoTienda pt) {
        return new ProductoTiendaDto(
                pt.getId(),
                pt.getProducto().getId(),
                pt.getProducto().getNombreGenerico(),
                pt.getSupermercado().getId(),
                pt.getSupermercado().getNombre(),
                pt.getUrlEspecifica(),
                pt.getCodigoExterno()
        );
    }
}

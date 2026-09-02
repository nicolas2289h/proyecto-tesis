package com.tesis.demo.service;

import com.tesis.demo.dto.ProductoComparativoDto;
import com.tesis.demo.dto.ProductoDto;
import com.tesis.demo.model.Categoria;
import com.tesis.demo.model.Producto;
import com.tesis.demo.repository.CategoriaRepository;
import com.tesis.demo.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    @Transactional
    public ProductoDto crear(ProductoDto dto) {
        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        boolean yaExiste = productoRepository.existsProductoDuplicado(
                dto.getNombreGenerico() != null ? dto.getNombreGenerico().trim() : "",
                dto.getMarca() != null ? dto.getMarca().trim() : null,
                dto.getVarianteEspecifica() != null ? dto.getVarianteEspecifica().trim() : null,
                dto.getPesoValor(),
                dto.getPesoUnidad() != null ? dto.getPesoUnidad().trim() : null,
                dto.getCategoriaId()
        );

        if (yaExiste) {
            throw new IllegalArgumentException("El producto ya se encuentra previamente registrado en el catálogo maestro.");
        }

        Producto producto = new Producto();
        mapDtoToEntity(dto, producto, categoria);

        return toDto(productoRepository.save(producto));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoDto obtenerPorId(Long id) {
        return productoRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoDto> buscar(String nombre, String marca, Long categoriaId, Pageable pageable) {
        return productoRepository.buscarAvanzado(nombre, marca, categoriaId, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional
    public ProductoDto actualizar(Long id, ProductoDto dto) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        mapDtoToEntity(dto, producto, categoria);

        return toDto(productoRepository.save(producto));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new RuntimeException("Producto no encontrado");
        }
        productoRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoComparativoDto> obtenerProductosComparativos() {
        return productoRepository.obtenerProductosComparativos().stream()
                .map(row -> new ProductoComparativoDto(
                    row[0] != null ? ((Number) row[0]).longValue() : null, // id
                    (String) row[1],           // producto (nombre_generico)
                    (String) row[2],           // marca
                    row[3] != null ? ((Number) row[3]).doubleValue() : 0.0,  // precio
                    (String) row[4],           // urlImagen
                    (String) row[5]            // supermercado
                ))
                .collect(Collectors.toList());
    }

    // ─── Mappers ────────────────────────────────────────────────────────────────

    public ProductoDto toDto(Producto p) {
        return new ProductoDto(
                p.getId(),
                p.getNombreGenerico(),
                p.getMarca(),
                p.getVarianteEspecifica(),
                p.getPesoValor(),
                p.getPesoUnidad(),
                p.getCategoria().getId(),
                p.getCategoria().getNombre()
        );
    }

    private void mapDtoToEntity(ProductoDto dto, Producto producto, Categoria categoria) {
        producto.setNombreGenerico(dto.getNombreGenerico());
        producto.setMarca(dto.getMarca());
        producto.setVarianteEspecifica(dto.getVarianteEspecifica());
        producto.setPesoValor(dto.getPesoValor());
        producto.setPesoUnidad(dto.getPesoUnidad());
        producto.setCategoria(categoria);
    }
}

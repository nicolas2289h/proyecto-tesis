package com.tesis.demo.service;

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

        Producto producto = new Producto();
        producto.setNombreGenerico(dto.getNombreGenerico());
        producto.setMarca(dto.getMarca());
        producto.setCategoria(categoria);

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

        producto.setNombreGenerico(dto.getNombreGenerico());
        producto.setMarca(dto.getMarca());
        producto.setCategoria(categoria);

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

    private ProductoDto toDto(Producto p) {
        return new ProductoDto(
                p.getId(),
                p.getNombreGenerico(),
                p.getMarca(),
                p.getCategoria().getId(),
                p.getCategoria().getNombre()
        );
    }
}

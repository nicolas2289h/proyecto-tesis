package com.tesis.demo.service;

import com.tesis.demo.dto.CategoriaDto;
import com.tesis.demo.model.Categoria;
import com.tesis.demo.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Override
    @Transactional
    public CategoriaDto crear(CategoriaDto dto) {
        if (categoriaRepository.findByNombreIgnoreCase(dto.getNombre()).isPresent()) {
            throw new RuntimeException("Ya existe una categoría con ese nombre");
        }
        Categoria categoria = new Categoria();
        categoria.setNombre(dto.getNombre());
        return toDto(categoriaRepository.save(categoria));
    }

    @Override
    @Transactional(readOnly = true)
    public CategoriaDto obtenerPorId(Long id) {
        return categoriaRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaDto> listarTodas() {
        return categoriaRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoriaDto actualizar(Long id, CategoriaDto dto) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
        
        categoriaRepository.findByNombreIgnoreCase(dto.getNombre())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new RuntimeException("Ya existe otra categoría con ese nombre");
                    }
                });

        categoria.setNombre(dto.getNombre());
        return toDto(categoriaRepository.save(categoria));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        if (!categoriaRepository.existsById(id)) {
            throw new RuntimeException("Categoría no encontrada");
        }
        categoriaRepository.deleteById(id);
    }

    private CategoriaDto toDto(Categoria categoria) {
        return new CategoriaDto(categoria.getId(), categoria.getNombre());
    }
}

package com.tesis.demo.service;

import com.tesis.demo.dto.CriterioBusquedaDto;
import com.tesis.demo.model.Categoria;
import com.tesis.demo.model.CriterioBusqueda;
import com.tesis.demo.repository.CategoriaRepository;
import com.tesis.demo.repository.CriterioBusquedaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CriterioBusquedaServiceImpl implements CriterioBusquedaService {

    private final CriterioBusquedaRepository criterioRepository;
    private final CategoriaRepository categoriaRepository;

    @Override
    @Transactional
    public CriterioBusquedaDto crear(CriterioBusquedaDto dto) {
        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + dto.getCategoriaId()));

        CriterioBusqueda criterio = new CriterioBusqueda();
        criterio.setTerminoBusqueda(dto.getTerminoBusqueda().trim().toLowerCase());
        criterio.setCategoria(categoria);

        return toDto(criterioRepository.save(criterio));
    }

    @Override
    @Transactional(readOnly = true)
    public CriterioBusquedaDto obtenerPorId(Long id) {
        return criterioRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Criterio de búsqueda no encontrado con id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CriterioBusquedaDto> listarTodos() {
        return criterioRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CriterioBusquedaDto> listarPorCategoria(Long categoriaId) {
        return criterioRepository.findByCategoriaId(categoriaId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CriterioBusquedaDto actualizar(Long id, CriterioBusquedaDto dto) {
        CriterioBusqueda criterio = criterioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Criterio de búsqueda no encontrado con id: " + id));

        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada con id: " + dto.getCategoriaId()));

        criterio.setTerminoBusqueda(dto.getTerminoBusqueda().trim().toLowerCase());
        criterio.setCategoria(categoria);

        return toDto(criterioRepository.save(criterio));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {
        if (!criterioRepository.existsById(id)) {
            throw new RuntimeException("Criterio de búsqueda no encontrado con id: " + id);
        }
        criterioRepository.deleteById(id);
    }

    private CriterioBusquedaDto toDto(CriterioBusqueda c) {
        return new CriterioBusquedaDto(
                c.getId(),
                c.getTerminoBusqueda(),
                c.getCategoria().getId(),
                c.getCategoria().getNombre()
        );
    }
}

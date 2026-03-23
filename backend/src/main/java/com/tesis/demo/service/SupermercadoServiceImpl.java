package com.tesis.demo.service;

import com.tesis.demo.dto.SupermercadoDto;
import com.tesis.demo.model.Supermercado;
import com.tesis.demo.repository.SupermercadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupermercadoServiceImpl implements SupermercadoService {

    private final SupermercadoRepository supermercadoRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SupermercadoDto> findAll() {
        return supermercadoRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SupermercadoDto findById(Long id) {
        return supermercadoRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Supermercado no encontrado con ID: " + id));
    }

    @Override
    @Transactional
    public SupermercadoDto save(SupermercadoDto supermercadoDto) {
        if (supermercadoRepository.findByNombreIgnoreCase(supermercadoDto.getNombre()).isPresent()) {
            throw new RuntimeException("Ya existe un supermercado con ese nombre");
        }
        Supermercado supermercado = new Supermercado();
        supermercado.setNombre(supermercadoDto.getNombre());
        supermercado.setUrlBase(supermercadoDto.getUrlBase());
        return mapToDto(supermercadoRepository.save(supermercado));
    }

    @Override
    @Transactional
    public SupermercadoDto update(Long id, SupermercadoDto supermercadoDto) {
        Supermercado supermercado = supermercadoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supermercado no encontrado con ID: " + id));
        
        supermercadoRepository.findByNombreIgnoreCase(supermercadoDto.getNombre())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new RuntimeException("Ya existe otro supermercado con ese nombre");
                    }
                });

        supermercado.setNombre(supermercadoDto.getNombre());
        supermercado.setUrlBase(supermercadoDto.getUrlBase());
        return mapToDto(supermercadoRepository.save(supermercado));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!supermercadoRepository.existsById(id)) {
            throw new RuntimeException("Supermercado no encontrado con ID: " + id);
        }
        supermercadoRepository.deleteById(id);
    }

    private SupermercadoDto mapToDto(Supermercado supermercado) {
        return new SupermercadoDto(
                supermercado.getId(),
                supermercado.getNombre(),
                supermercado.getUrlBase()
        );
    }
}

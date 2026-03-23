package com.tesis.demo.service;

import com.tesis.demo.dto.SupermercadoDto;
import java.util.List;

public interface SupermercadoService {
    List<SupermercadoDto> findAll();
    SupermercadoDto findById(Long id);
    SupermercadoDto save(SupermercadoDto supermercadoDto);
    SupermercadoDto update(Long id, SupermercadoDto supermercadoDto);
    void delete(Long id);
}

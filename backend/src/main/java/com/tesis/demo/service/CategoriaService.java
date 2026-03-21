package com.tesis.demo.service;

import com.tesis.demo.dto.CategoriaDto;
import java.util.List;

public interface CategoriaService {
    CategoriaDto crear(CategoriaDto dto);
    CategoriaDto obtenerPorId(Long id);
    List<CategoriaDto> listarTodas();
    CategoriaDto actualizar(Long id, CategoriaDto dto);
    void eliminar(Long id);
}
